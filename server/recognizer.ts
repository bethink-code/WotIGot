import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";

export interface GroupedRecognitionResult {
  brand: string;
  model: string;
  price: number;
  category: string;
  count: number;
}

export interface AiUsageStats {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

// Gemini 3 Flash pricing: $0.50/1M input, $3.00/1M output
const COST_PER_INPUT_TOKEN = 0.50 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 3.00 / 1_000_000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ── Identify model: groups products, assigns prices (no counting) ──

const identifySchema = {
  description: "Grouped product identification",
  type: SchemaType.OBJECT,
  properties: {
    groups: {
      type: SchemaType.ARRAY,
      description: "Array of dominant product groups",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING, description: "Short consistent label for grouping, e.g. 'Quality Street tin'", nullable: false },
          brand: { type: SchemaType.STRING, description: "Brand name", nullable: false },
          model: { type: SchemaType.STRING, description: "Product model/description with size", nullable: false },
          price: { type: SchemaType.NUMBER, description: "Per-unit price in ZAR", nullable: false },
          category: { type: SchemaType.STRING, description: "Product category", nullable: false },
        },
        required: ["label", "brand", "model", "price", "category"],
      },
    },
  },
  required: ["groups"],
};

const identifyModel: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: identifySchema,
  },
});

// ── Count model: bounding boxes per item with label ──

const countSchema = {
  description: "Bounding boxes for each visible item",
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      description: "One entry per visible physical item",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING, description: "Short product label matching the product group, e.g. 'Quality Street tin'" },
          box_2d: {
            type: SchemaType.ARRAY,
            description: "Bounding box as [y0, x0, y1, x1] normalized 0-1000",
            items: { type: SchemaType.NUMBER },
          },
        },
        required: ["label", "box_2d"],
      },
    },
  },
  required: ["items"],
};

const countModel: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: countSchema,
  },
});

/**
 * Recognize and group all dominant products in an image.
 * Two parallel Gemini calls:
 *   1. Identify: what products are here, what do they cost
 *   2. Count: bounding box every individual item, count boxes per label
 * Merge by matching labels to get accurate per-group counts.
 * This is the ONLY recognition path. All endpoints use this function.
 */
export async function recognizeGroupedItems(
  buffer: Buffer,
  mimeType: string
): Promise<{ groups: GroupedRecognitionResult[]; usage: AiUsageStats }> {
  const imageData = { inlineData: { data: buffer.toString("base64"), mimeType } };

  let identifyResult, countResult;
  try {
    [identifyResult, countResult] = await Promise.all([
      identifyModel.generateContent([
        {
          text: `You are a product recognition system for South Africa.

Identify all DOMINANT products in this image. A dominant product appears substantially — not edge items, price tags, or signage.

GROUP identical items. Two items are identical if same brand, model, and size/variant.

For each group return:
- label: a short consistent name for this product type (e.g. "Quality Street tin", "Terry's Orange tin"). This label is used to match with counted items, so keep it simple and consistent.
- brand: manufacturer name
- model: full product name with size (e.g. "Quality Street Assorted Chocolate Tin 969g")
- price: per-unit retail price in South African Rand (ZAR)
- category: product category

If only one product type, return one group. If no identifiable products, return empty array.`,
        },
        imageData,
      ]),
      countModel.generateContent([
        {
          text: `Draw a bounding box around every individual physical item in this image.

For each item, provide:
- label: a short product name (e.g. "Quality Street tin", "Terry's Orange tin"). Use the SAME label for identical products.
- box_2d: bounding box coordinates [y0, x0, y1, x1] normalized 0-1000

RULES:
- Each tin, box, bottle, bag gets its OWN box — even if identical. 12 identical tins = 12 boxes.
- Only box items you can clearly see — full face/label visible, or a distinct edge/top proving it exists.
- Do NOT box items hidden behind the front row unless you can see clear evidence (tops above, labels peeking out). No depth cues = one layer only.
- Do NOT box price tags, signage, shelf labels, or peripheral items barely in frame.
- Items in sealed multi-packs: box the pack as 1, not individual units inside.`,
        },
        imageData,
      ]),
    ]);
  } catch (err) {
    console.error("[recognizer] Gemini API error:", err);
    throw new Error("AI recognition failed. Please try again.");
  }

  let identifyData: any, countData: any;
  try {
    identifyData = JSON.parse(identifyResult.response.text());
  } catch {
    console.error("[recognizer] Failed to parse identify response:", identifyResult.response.text());
    throw new Error("AI returned an invalid response. Please try again.");
  }
  try {
    countData = JSON.parse(countResult.response.text());
  } catch {
    console.error("[recognizer] Failed to parse count response:", countResult.response.text());
    countData = { items: [] };
  }

  console.log("[recognizer] identify response:", JSON.stringify(identifyData));
  console.log("[recognizer] count response:", JSON.stringify(countData));

  // Aggregate usage from both calls
  const idMeta = identifyResult.response.usageMetadata;
  const ctMeta = countResult.response.usageMetadata;
  const inputTokens = (idMeta?.promptTokenCount ?? 0) + (ctMeta?.promptTokenCount ?? 0);
  const outputTokens = (idMeta?.candidatesTokenCount ?? 0) + (ctMeta?.candidatesTokenCount ?? 0);
  const usage: AiUsageStats = {
    inputTokens,
    outputTokens,
    estimatedCostUsd: inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN,
  };

  if (!Array.isArray(identifyData.groups) || identifyData.groups.length === 0) {
    return { groups: [], usage };
  }

  // Count boxes per label
  const boxCounts: Record<string, number> = {};
  if (Array.isArray(countData.items)) {
    for (const item of countData.items) {
      const lbl = (item.label || "").toLowerCase().trim();
      boxCounts[lbl] = (boxCounts[lbl] || 0) + 1;
    }
  }
  console.log("[recognizer] box counts:", boxCounts);

  // Match each identify group to its box count using fuzzy word matching
  const usedBoxLabels = new Set<string>();

  const groups = identifyData.groups.map((g: any) => {
    const groupLabel = (g.label || "").toLowerCase().trim();
    const groupWords = new Set<string>(groupLabel.split(/\s+/).filter((w: string) => w.length > 2));
    // Also include words from brand and model for matching
    const extraWords = `${g.brand || ""} ${g.model || ""}`.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    extraWords.forEach((w: string) => groupWords.add(w));

    // Find best matching box label by word overlap
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [boxLabel, boxCount] of Object.entries(boxCounts)) {
      if (usedBoxLabels.has(boxLabel)) continue;

      // Exact match
      if (boxLabel === groupLabel) {
        bestMatch = boxLabel;
        bestScore = Infinity;
        break;
      }

      // Word overlap score
      const boxWords = boxLabel.split(/\s+/).filter(w => w.length > 2);
      let score = 0;
      for (const bw of boxWords) {
        for (const gw of groupWords) {
          if (bw === gw || bw.includes(gw) || gw.includes(bw)) {
            score++;
            break;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = boxLabel;
      }
    }

    const count = bestMatch ? boxCounts[bestMatch] : undefined;
    if (bestMatch) usedBoxLabels.add(bestMatch);

    console.log(`[recognizer] match: "${groupLabel}" → "${bestMatch}" (score: ${bestScore}, count: ${count ?? "none"})`);

    return {
      brand: g.brand || "Unknown",
      model: g.model || "Unknown",
      price: g.price || 0,
      category: g.category || "Uncategorised",
      count: count ?? 1,
    };
  });

  return { groups, usage };
}

// ── Text-only price lookup (no image) ──

const priceSchema = {
  description: "Price lookup result",
  type: SchemaType.OBJECT,
  properties: {
    price: { type: SchemaType.NUMBER, description: "Estimated price in ZAR", nullable: false },
  },
  required: ["price"],
};

const priceModel: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: priceSchema,
  },
});

/**
 * Ask price based on brand/model text (no image).
 */
export async function askPrice(brand: string, model: string): Promise<{ price: number }> {
  const result = await priceModel.generateContent([
    {
      text: `What is the average retail price in South Africa (ZAR) for: ${brand} ${model}`,
    },
  ]);

  const data = JSON.parse(result.response.text());
  return { price: data.price };
}
