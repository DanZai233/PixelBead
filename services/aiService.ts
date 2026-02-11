import { AIProvider, AIConfig, AI_MODELS, DEFAULT_ENDPOINTS } from '../types';

export const generatePixelArtImage = async (
  prompt: string,
  config: AIConfig
): Promise<string> => {
  const models = AI_MODELS[config.provider];
  const model = config.model || models[0]?.id;
  const endpoint = config.endpoint || DEFAULT_ENDPOINTS[config.provider] || '';

  switch (config.provider) {
    case AIProvider.OPENAI:
      return await generateOpenAI(prompt, config.apiKey, endpoint, model);
    
    case AIProvider.OPENROUTER:
      return await generateOpenRouter(prompt, config.apiKey, endpoint, model, config.imageUrlModel);
    
    case AIProvider.DEEPSEEK:
      throw new Error('DeepSeek 目前不支持图像生成，请使用其他服务商');
    
    case AIProvider.VOLCENGINE:
      return await generateVolcEngine(prompt, config.apiKey, endpoint, model);
    
    case AIProvider.GEMINI:
      return await generateGemini(prompt, config.apiKey, model);
    
    case AIProvider.CUSTOM:
      return await generateOpenAI(prompt, config.apiKey, endpoint, model);
    
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
};

const generateOpenAI = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string = 'gpt-4o'
): Promise<string> => {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: `Generate a high-quality 1:1 square pixel art image of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    return await processOpenAIResponse(data, baseUrl, apiKey);
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    throw error;
  }
};

const processOpenAIResponse = async (
  data: any,
  baseUrl: string,
  apiKey: string
): Promise<string> => {
  if (data.choices?.[0]?.message?.tool_calls) {
    for (const toolCall of data.choices[0].message.tool_calls) {
      if (toolCall.function.name === 'dalle.text2im') {
        const args = JSON.parse(toolCall.function.arguments);
        
        const imageResponse = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: args.model || 'dall-e-3',
            prompt: args.prompt,
            n: 1,
            size: args.size || '1024x1024',
            response_format: 'b64_json',
          }),
        });

        if (!imageResponse.ok) {
          const error = await imageResponse.json();
          throw new Error(error.error?.message || 'Failed to generate image');
        }

        const imageData = await imageResponse.json();
        if (imageData.data?.[0]?.b64_json) {
          return `data:image/png;base64,${imageData.data[0].b64_json}`;
        }
        
        throw new Error('No image generated');
      }
    }
    
    throw new Error('No image generation tool call found');
  }
  
  throw new Error('No image data in response');
};

const generateOpenRouter = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  imageUrlModel?: string
): Promise<string> => {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://pixelbead.studio',
      },
      body: JSON.stringify({
        model: imageUrlModel || 'openai/dall-e-3',
        messages: [
          {
            role: 'user',
            content: `Generate a high-quality 1:1 square pixel art image of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    return await processOpenAIResponse(data, 'https://api.openai.com/v1', apiKey);
  } catch (error) {
    console.error('OpenRouter image generation error:', error);
    throw error;
  }
};

const generateVolcEngine = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string = 'doubao-seedream-4-5-251128'
): Promise<string> => {
  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: `A high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
        size: '2K',
        response_format: 'b64_json',
        n: 1,
        watermark: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(parseVolcEngineError(errorJson));
      } catch {
        throw new Error(errorText || 'Failed to generate image');
      }
    }

    const data = await response.json();
    if (data.output?.b64_json) {
      return `data:image/png;base64,${data.output.b64_json}`;
    }
    
    throw new Error('No image generated');
  } catch (error) {
    console.error('VolcEngine image generation error:', error);
    throw error;
  }
};

const parseVolcEngineError = (error: any): string => {
  if (error.error?.message) {
    const message = error.error.message.toLowerCase();
    
    if (message.includes('size') && message.includes('least')) {
      return '火山引擎要求图像尺寸至少为 3686400 像素（约 2048x2048），当前 API 不支持 1024x1024。请使用其他 AI 服务商。';
    }
    
    if (message.includes('model') || message.includes('not found')) {
      return `模型名称错误：${error.error.message}`;
    }
    
    if (message.includes('api key') || message.includes('unauthorized')) {
      return 'API Key 无效或已过期';
    }
    
    if (message.includes('quota') || message.includes('limit') || message.includes('rate')) {
      return '已达到 API 使用配额或速率限制';
    }
    
    if (message.includes('content_filter')) {
      return '内容被过滤，请修改提示词后重试';
    }
  }
  
  return error.error?.message || error.message || '未知错误';
};

const generateGemini = async (
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: {
          parts: [
            {
              text: `Generate a high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`,
            }
          ]
        },
        generationConfig: {
          responseModalities: ['text', 'image'],
          imageGenerationConfig: {
            aspectRatio: "1:1"
          }
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    for (const part of data.candidates?.[0]?.content?.parts || []) {
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
