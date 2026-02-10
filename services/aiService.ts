import { AIProvider, AIConfig, AI_MODELS, DEFAULT_ENDPOINTS } from '../types';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

export const generatePixelArtImage = async (
  prompt: string,
  config: AIConfig
): Promise<string> => {
  const models = AI_MODELS[config.provider];
  const model = config.model || models[0]?.id;
  const endpoint = config.endpoint || DEFAULT_ENDPOINTS[config.provider] || '';

  switch (config.provider) {
    case AIProvider.OPENAI:
    case AIProvider.OPENROUTER:
    case AIProvider.DEEPSEEK:
    case AIProvider.VOLCENGINE:
    case AIProvider.CUSTOM:
      return await generateOpenAICompatible(prompt, config.apiKey, endpoint, model, config.imageUrlModel);
    
    case AIProvider.GEMINI:
      return await generateGemini(prompt, config.apiKey, model);
    
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
};

const generateOpenAICompatible = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string = 'dall-e-3',
  imageUrlModel?: string
): Promise<string> => {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true,
  });

  try {
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
  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('size')) {
        throw new Error('图像尺寸参数错误，请检查模型是否支持 1024x1024 尺寸');
      }
      
      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        throw new Error(`模型 "${imageUrlModel || model}" 不存在或不支持，请检查模型名称`);
      }
      
      if (errorMessage.includes('invalid api key') || errorMessage.includes('unauthorized')) {
        throw new Error('API Key 无效或已过期');
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('rate limit')) {
        throw new Error('已达到 API 使用配额或速率限制');
      }
    }
    
    throw error;
  }
};

const generateGemini = async (
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> => {
  try {
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
  } catch (error) {
    console.error('Gemini image generation error:', error);
    throw error;
  }
};

export const validateApiKey = async (
  provider: AIProvider,
  apiKey: string,
  endpoint?: string
): Promise<boolean> => {
  try {
    const config: AIConfig = { 
      provider, 
      apiKey, 
      endpoint: endpoint || DEFAULT_ENDPOINTS[provider]
    };
    await generatePixelArtImage('test', config);
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};
