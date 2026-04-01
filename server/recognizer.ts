import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";

export interface RecognitionResult {
  brand?: string;
  model?: string;
  price?: number;
  category?: string;
  amount?: number;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const schema = {
  description: "Object details",
  type: SchemaType.OBJECT,
  properties: {
    barcode: { type: SchemaType.STRING, description: "Barcode number", nullable: true },
    brand: { type: SchemaType.STRING, description: "Brand name", nullable: false },
    model: { type: SchemaType.STRING, description: "Product model", nullable: false },
    price: { type: SchemaType.NUMBER, description: "Estimated price in South Africa", nullable: false },
    category: { type: SchemaType.STRING, description: "Product category", nullable: false },
    amount: { type: SchemaType.NUMBER, description: "Amount of items in the image", nullable: false },
  },
  required: ["barcode", "brand", "model", "price", "category", "amount"],
};

const generativeModel: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

/**
 * Recognize item brand, model, price from an uploaded image buffer.
 */
export async function recognizeItem(
  buffer: Buffer,
  mimeType: string
): Promise<RecognitionResult> {
  const result = await generativeModel.generateContent([
    {
      text: `You are an advanced object recognition and inventory counting system for South Africa.

STEP 1 — COUNT ITEMS (CRITICAL):
Before identifying, you MUST count every individual item in the image:
- Zoom into different regions of the image systematically (top-left, top-right, bottom-left, bottom-right, center).
- For each region, identify and mentally number every visible item.
- Count partially hidden items: if you can see any portion (top, edge, label, handle, cap), it counts as 1 item.
- Count stacked items: if items are stacked, estimate the stack depth from visible edges or labels.
- Count grouped items: items in packs, boxes, or bundles — count individual units, not containers.
- After scanning all regions, sum your counts to get the total amount.
- If you are uncertain about the count, err on the HIGHER side — it is better to overcount for insurance/inventory purposes.

STEP 2 — IDENTIFY:
Determine if the image contains a barcode or an object.

If barcode found:
- Extract the barcode number exactly as it appears.
- Look up product details in South African retail databases.
- Validate that the product matches the visible object.

If no barcode:
- Identify brand, model, and category from visual features (logos, text, shape, packaging).
- Search for the product's average retail price in South Africa (ZAR).

STEP 3 — PRICE:
- Return the per-unit price in ZAR (not total for all items).
- Use South African retail pricing sources.

FORMAT — Return JSON only:
{
  "barcode": "123456789012" or null,
  "brand": "Brand Name",
  "model": "Product Model",
  "price": 1999,
  "category": "Product Category",
  "amount": 3
}

The "amount" field is the total count from Step 1. The "price" is per-unit from Step 3.`,
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType },
    },
  ]);

  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}

/**
 * Build a delta-aware prompt for re-estimation.
 */
function buildDeltaPrompt(
  userValues?: { brand?: string; model?: string; category?: string },
  originalValues?: { brand?: string; model?: string; category?: string; price?: number }
): string {
  if (!originalValues || !userValues) return "";

  const changes: string[] = [];
  if (originalValues.model !== userValues.model && userValues.model) {
    changes.push(`Model/Description changed: "${originalValues.model || "unknown"}" → "${userValues.model}"`);
  }
  if (originalValues.brand !== userValues.brand && userValues.brand) {
    changes.push(`Brand changed: "${originalValues.brand || "unknown"}" → "${userValues.brand}"`);
  }
  if (originalValues.category !== userValues.category && userValues.category) {
    changes.push(`Category changed: "${originalValues.category || "unknown"}" → "${userValues.category}"`);
  }

  if (changes.length > 0) {
    return `
USER HAS MADE THE FOLLOWING CORRECTIONS:
${changes.join("\n")}

Original price was: R${originalValues.price || "unknown"}

IMPORTANT: The user has corrected specifications that affect pricing.
- If size/weight/capacity changed (e.g., "1kg" to "2kg"), adjust price proportionally.
- Larger sizes typically cost more. Double the size often means 1.5x to 2x the price.
- Use the CORRECTED values to determine the new price.

Current specifications to price:
- Brand: ${userValues.brand || originalValues.brand || "unknown"}
- Model/Description: ${userValues.model || originalValues.model || "unknown"}
- Category: ${userValues.category || originalValues.category || "unknown"}`;
  }

  return `
PRICING REQUEST:
- Brand: ${userValues.brand || "unknown"}
- Model/Description: ${userValues.model || "unknown"}
- Category: ${userValues.category || "unknown"}`;
}

/**
 * Re-estimate from image URL with delta-aware pricing.
 */
export async function reEstimateFromUrl(
  imageUrl: string,
  userValues?: { brand?: string; model?: string; category?: string },
  originalValues?: { brand?: string; model?: string; category?: string; price?: number }
): Promise<RecognitionResult> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) throw new Error(`Invalid content type: ${contentType}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const deltaPrompt = buildDeltaPrompt(userValues, originalValues);

  const result = await generativeModel.generateContent([
    {
      text: `You are a South African retail pricing expert. Re-estimate the price for this product.
${deltaPrompt}

PRICING RULES:
1. Use the specifications provided above - they are CORRECT.
2. Price MUST reflect the exact size/weight/capacity mentioned.
3. If the user changed size (e.g., 1kg to 2kg), the new price should be proportionally higher.
4. Return the South African retail price in ZAR.

Format response as JSON only:
{
  "barcode": null,
  "brand": "Brand Name",
  "model": "Product Model with size",
  "price": 1999,
  "category": "Product Category",
  "amount": 1
}`,
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType: contentType || "image/jpeg" },
    },
  ]);

  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}

/**
 * Re-estimate from uploaded file buffer with delta-aware pricing.
 */
export async function reEstimateFromFile(
  buffer: Buffer,
  mimeType: string,
  userValues?: { brand?: string; model?: string; category?: string },
  originalValues?: { brand?: string; model?: string; category?: string; price?: number }
): Promise<RecognitionResult> {
  const deltaPrompt = buildDeltaPrompt(userValues, originalValues);

  const result = await generativeModel.generateContent([
    {
      text: `You are a South African retail pricing expert. Re-estimate the price for this product.
${deltaPrompt}

PRICING RULES:
1. Use the specifications provided above - they are CORRECT.
2. Price MUST reflect the exact size/weight/capacity mentioned.
3. If the user changed size (e.g., 1kg to 2kg), the new price should be proportionally higher.
4. Return the South African retail price in ZAR.

Format response as JSON only:
{
  "barcode": null,
  "brand": "Brand Name",
  "model": "Product Model with size",
  "price": 1999,
  "category": "Product Category",
  "amount": 1
}`,
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType },
    },
  ]);

  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}

/**
 * Ask price based on brand/model text (no image).
 */
export async function askPrice(brand: string, model: string): Promise<{ price: number }> {
  const result = await generativeModel.generateContent({
    systemInstruction: {
      role: "system",
      parts: [{ text: "not realtime information is appropriate, it's just testing" }],
    },
    contents: [
      {
        role: "user",
        parts: [
          { text: `What is the average product price in South Africa for a: ${brand} ${model}. In pure JSON format without arrays, here is the example: {"price": 17999}.` },
          { text: `${brand} ${model}` },
        ],
      },
    ],
  });

  const text = result.response.text();
  const matches = /```(?:json)?(.+?)```/gims.exec(text);
  const data = JSON.parse((matches ? matches[1] : text).trim());
  return { price: data.price };
}
