import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

interface GenerateRequest {
  prompt: string;
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt, provider, apiKey, model, baseUrl }: GenerateRequest = await req.json();

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
        imageData = await generateOpenAI(prompt, apiKey, baseUrl, model);
        break;
      case 'DEEPSEEK':
        imageData = await generateDeepSeek(prompt, apiKey, model);
        break;
      case 'VOLCENGINE':
        imageData = await generateVolcEngine(prompt, apiKey, model);
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

async function generateOpenAI(
  prompt: string,
  apiKey: string,
  baseUrl?: string,
  model: string = 'gpt-4o'
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });

  const response = await client.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Generate a high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
          },
        ],
      },
    ],
  });

  const outputItem = response.output[0];
  if (outputItem && 'content' in outputItem && outputItem.content[0]) {
    const content = outputItem.content[0];
    if ('image_url' in content) {
      return (content as any).image_url.url;
    }
  }
  
  throw new Error('No image generated');
}

async function generateDeepSeek(
  prompt: string,
  apiKey: string,
  model: string = 'deepseek-chat'
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: `A high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
    size: '1024x1024',
    response_format: 'b64_json',
  });

  const imageData = response.data[0]?.b64_json;
  if (imageData) {
    return `data:image/png;base64,${imageData}`;
  }
  
  throw new Error('No image generated');
}

async function generateVolcEngine(
  prompt: string,
  apiKey: string,
  model: string = 'doubao-pro-32k'
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: `A high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
    size: '1024x1024',
    response_format: 'b64_json',
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
    model: 'gemini-2.0-flash-exp',
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
