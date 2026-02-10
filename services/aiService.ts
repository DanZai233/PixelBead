import { AIProvider, AIConfig, AI_MODELS } from '../types';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

export const generatePixelArtImage = async (
  prompt: string,
  config: AIConfig
): Promise<string> => {
  const models = AI_MODELS[config.provider];
  const model = config.model || models[0].id;

  switch (config.provider) {
    case AIProvider.OPENAI:
    case AIProvider.OPENROUTER:
      return await generateOpenAI(prompt, config.apiKey, config.baseUrl, model);
    
    case AIProvider.DEEPSEEK:
      return await generateDeepSeek(prompt, config.apiKey, model);
    
    case AIProvider.VOLCENGINE:
      return await generateVolcEngine(prompt, config.apiKey, model);
    
    case AIProvider.GEMINI:
      return await generateGemini(prompt, config.apiKey, model);
    
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
};

const generateOpenAI = async (
  prompt: string,
  apiKey: string,
  baseUrl?: string,
  model: string = 'gpt-4o'
): Promise<string> => {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
    dangerouslyAllowBrowser: true,
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
};

const generateDeepSeek = async (
  prompt: string,
  apiKey: string,
  model: string = 'deepseek-chat'
): Promise<string> => {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true,
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
};

const generateVolcEngine = async (
  prompt: string,
  apiKey: string,
  model: string = 'doubao-pro-32k'
): Promise<string> => {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true,
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
};

const generateGemini = async (
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> => {
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
};

export const validateApiKey = async (
  provider: AIProvider,
  apiKey: string
): Promise<boolean> => {
  try {
    const config: AIConfig = { provider, apiKey };
    await generatePixelArtImage('test', config);
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};
