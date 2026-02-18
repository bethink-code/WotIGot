import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskPriceDto } from 'src/items/dto/ask-price.dto';

export interface RecognitionResult {
  brand?: string;
  model?: string;
  price?: number;
  category?: string;
  amount?: number;
}

@Injectable()
export class RecognizerService {
  private generativeModel: GenerativeModel;

  constructor(private readonly config: ConfigService) {
    const genAI = new GoogleGenerativeAI(this.config.get('GEMINI_API_KEY'));
    const schema = {
      description: 'Object details',
      type: SchemaType.OBJECT,
      properties: {
        barcode: {
          type: SchemaType.STRING,
          description: 'Barcode number',
          nullable: true,
        },
        brand: {
          type: SchemaType.STRING,
          description: 'Brand name',
          nullable: false,
        },
        model: {
          type: SchemaType.STRING,
          description: 'Product model',
          nullable: false,
        },
        price: {
          type: SchemaType.NUMBER,
          description: 'Estimated price in South Africa',
          nullable: false,
        },
        category: {
          type: SchemaType.STRING,
          description: 'Product category',
          nullable: false,
        },
        amount: {
          type: SchemaType.NUMBER,
          description: 'Amount of items in the image',
          nullable: false,
        },
      },
      required: ['barcode', 'brand', 'model', 'price', 'category', 'amount'],
    };
    this.generativeModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
  }

  /**
   * Recognize the item brand, model and price from the image
   * @param image - The image to recognize
   */
  async recognizeItem(image: Express.Multer.File): Promise<RecognitionResult> {
    const result = await this.generativeModel.generateContent([
      {
        text: `You are an advanced object recognition and inventory system for South Africa. I will upload an image, and you must determine whether it contains a barcode or an object.

        COUNTING INSTRUCTION: Count ALL items visible in the image, including partially hidden or stacked items. If you can see any portion of an item (top, edge, label, or any identifying feature), count it.

        1. Barcode Detection:
        If the image contains a barcode, extract the barcode number exactly as it appears.
        Search for product details only in South African databases.
        Validate that the retrieved product matches the object in the image.
        Format the response as JSON:
        {
          "barcode": "123456789012",
          "brand": "Brand Name",
          "model": "Product Model",
          "price": 1999,
          "category": "Product Category",
          "amount": 1
        }

        2. Object Recognition (No Barcode Found):
        If the image does not contain a barcode, analyze the object.
        Extract brand, model, category, and average price from South African sources.
        If multiple identical objects are detected, report quantity and average price.
        Format the response as JSON:
        {
          "barcode": null,
          "brand": "Brand Name",
          "model": "Product Model",
          "price": 1999,
          "category": "Product Category",
          "amount": 1
        }

        Please process the image accordingly and provide accurate results.`,
      },
      {
        inlineData: {
          data: image.buffer.toString('base64'),
          mimeType: image.mimetype,
        },
      },
    ]);
    const text = result.response.text();
    const data = JSON.parse(text);

    return {
      brand: data.brand,
      model: data.model,
      price: data.price,
      category: data.category,
      amount: data.amount,
    };
  }

  /**
   * Re-estimate item from image URL with delta-aware pricing
   * @param imageUrl - URL of the image to analyze
   * @param userValues - User's current/updated values
   * @param originalValues - Original values from the database (what AI initially detected)
   */
  async reEstimateFromUrl(
    imageUrl: string,
    userValues?: { brand?: string; model?: string; category?: string },
    originalValues?: { brand?: string; model?: string; category?: string; price?: number },
  ): Promise<RecognitionResult> {
    console.log(`Re-estimating from URL: ${imageUrl}`);
    console.log(`User's updated values:`, userValues);
    console.log(`Original values:`, originalValues);
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`Image content-type: ${contentType}`);
    
    if (!contentType?.startsWith('image/')) {
      console.error(`Invalid content type received: ${contentType}`);
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = contentType || 'image/jpeg';
    
    console.log(`Image size: ${buffer.length} bytes`);

    // Build delta-aware prompt showing what changed
    let deltaPrompt = '';
    if (originalValues && userValues) {
      const changes: string[] = [];
      
      if (originalValues.model !== userValues.model && userValues.model) {
        changes.push(`Model/Description changed: "${originalValues.model || 'unknown'}" → "${userValues.model}"`);
      }
      if (originalValues.brand !== userValues.brand && userValues.brand) {
        changes.push(`Brand changed: "${originalValues.brand || 'unknown'}" → "${userValues.brand}"`);
      }
      if (originalValues.category !== userValues.category && userValues.category) {
        changes.push(`Category changed: "${originalValues.category || 'unknown'}" → "${userValues.category}"`);
      }
      
      if (changes.length > 0) {
        deltaPrompt = `
USER HAS MADE THE FOLLOWING CORRECTIONS:
${changes.join('\n')}

Original price was: R${originalValues.price || 'unknown'}

IMPORTANT: The user has corrected specifications that affect pricing.
- If size/weight/capacity changed (e.g., "1kg" to "2kg"), adjust price proportionally.
- Larger sizes typically cost more. Double the size often means 1.5x to 2x the price.
- Use the CORRECTED values to determine the new price.

Current specifications to price:
- Brand: ${userValues.brand || originalValues.brand || 'unknown'}
- Model/Description: ${userValues.model || originalValues.model || 'unknown'}
- Category: ${userValues.category || originalValues.category || 'unknown'}`;
      } else {
        deltaPrompt = `
PRICING REQUEST:
- Brand: ${userValues.brand || 'unknown'}
- Model/Description: ${userValues.model || 'unknown'}  
- Category: ${userValues.category || 'unknown'}`;
      }
    }

    const result = await this.generativeModel.generateContent([
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
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType,
        },
      },
    ]);
    const text = result.response.text();
    console.log(`AI re-estimate response: ${text}`);
    const data = JSON.parse(text);

    return {
      brand: data.brand,
      model: data.model,
      price: data.price,
      category: data.category,
      amount: data.amount,
    };
  }

  /**
   * Re-estimate item from uploaded image with delta-aware pricing (for new items not yet saved)
   * @param image - The uploaded image file
   * @param userValues - User's current/updated values
   * @param originalValues - Original AI-detected values
   */
  async reEstimateFromFile(
    image: Express.Multer.File,
    userValues?: { brand?: string; model?: string; category?: string },
    originalValues?: { brand?: string; model?: string; category?: string; price?: number },
  ): Promise<RecognitionResult> {
    console.log(`Re-estimating from uploaded file`);
    console.log(`User's updated values:`, userValues);
    console.log(`Original values:`, originalValues);

    // Build delta-aware prompt showing what changed
    let deltaPrompt = '';
    if (originalValues && userValues) {
      const changes: string[] = [];
      
      if (originalValues.model !== userValues.model && userValues.model) {
        changes.push(`Model/Description changed: "${originalValues.model || 'unknown'}" → "${userValues.model}"`);
      }
      if (originalValues.brand !== userValues.brand && userValues.brand) {
        changes.push(`Brand changed: "${originalValues.brand || 'unknown'}" → "${userValues.brand}"`);
      }
      if (originalValues.category !== userValues.category && userValues.category) {
        changes.push(`Category changed: "${originalValues.category || 'unknown'}" → "${userValues.category}"`);
      }
      
      if (changes.length > 0) {
        deltaPrompt = `
USER HAS MADE THE FOLLOWING CORRECTIONS:
${changes.join('\n')}

Original price was: R${originalValues.price || 'unknown'}

IMPORTANT: The user has corrected specifications that affect pricing.
- If size/weight/capacity changed (e.g., "1kg" to "2kg"), adjust price proportionally.
- Larger sizes typically cost more. Double the size often means 1.5x to 2x the price.
- Use the CORRECTED values to determine the new price.

Current specifications to price:
- Brand: ${userValues.brand || originalValues.brand || 'unknown'}
- Model/Description: ${userValues.model || originalValues.model || 'unknown'}
- Category: ${userValues.category || originalValues.category || 'unknown'}`;
      } else {
        deltaPrompt = `
PRICING REQUEST:
- Brand: ${userValues.brand || 'unknown'}
- Model/Description: ${userValues.model || 'unknown'}  
- Category: ${userValues.category || 'unknown'}`;
      }
    }

    const result = await this.generativeModel.generateContent([
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
        inlineData: {
          data: image.buffer.toString('base64'),
          mimeType: image.mimetype,
        },
      },
    ]);
    const text = result.response.text();
    console.log(`AI re-estimate response: ${text}`);
    const data = JSON.parse(text);

    return {
      brand: data.brand,
      model: data.model,
      price: data.price,
      category: data.category,
      amount: data.amount,
    };
  }

  /**
   * Recognize the item brand, model and price from the image
   * @param image - The image to recognize
   */
  async askPrice(payload: AskPriceDto): Promise<{ price: number }> {
    const result = await this.generativeModel.generateContent({
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: "not realtime information is appropriate, it's just testing",
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `What is the average product price in South Africa for a: ${payload.brand} ${payload.model}. In pure JSON format without arrays, here is the example: {"price": 17999}.`,
            },
            {
              text: `${payload.brand} ${payload.model}`,
            },
          ],
        },
      ],
    });
    const text = result.response.text();
    const matches = /```(?:json)?(.+?)```/gims.exec(text);
    console.log(`Received response: ${matches ? matches[1] : text}`);
    const data = JSON.parse((matches ? matches[1] : text).trim());

    return {
      price: data.price,
    };
  }
}
