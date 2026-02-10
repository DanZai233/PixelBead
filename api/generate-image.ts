import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

interface GenerateRequest {
  prompt: string;
  provider: string;
  apiKey: string;
  model?: string;
  endpoint?: string;
  imageUrlModel?: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt, provider, apiKey, model, endpoint, imageUrlModel }: GenerateRequest = await req.json();

    if (!prompt || !provider || !apiKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let imageData: string;

    switch (provider) {
      case 'OPENAI':
      case 'OPENROUTER':
      case 'DEEPSEEK':
      case 'VOLCENGINE':
      case 'CUSTOM':
        imageData = await generateOpenAICompatible(prompt, apiKey, endpoint, model, imageUrlModel);
        break;
      case 'GEMINI':
        imageData = await generateGemini(prompt, apiKey, model);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unsupported provider' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ data: imageData }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function generateOpenAICompatible(
  prompt: string,
  apiKey: string,
  baseUrl: string = '',
  model: string = 'dall-e-3',
  imageUrlModel?: string
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });

  const response = await client.images.generate({
    model: imageUrlModel || model,
    prompt: `A high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
    size: '1024x1024',
    response_format: 'b64_json',
    n: 1,
  });

  const imageData = response.data[0]?.b64_json;
  if (imageData) {
    return `data:image/png;base64,${imageData}`;
  }
  
  throw new Error('No image generated');
}

async function generateGemini(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: model || 'gemini-2.0-flash-exp',
    contents: {
      parts: [
        {
          text: `Generate a high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No valid image part returned.");
}
