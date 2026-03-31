import { AIProvider, AIConfig, AI_MODELS, DEFAULT_ENDPOINTS } from '../types';

const PIXEL_ART_PROMPT =
  'The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.';

export const generatePixelArtImage = async (
  prompt: string,
  config: AIConfig,
  referenceImage?: string
): Promise<string> => {
  const models = AI_MODELS[config.provider];
  const model = config.model || models[0]?.id;
  const endpoint = config.endpoint || DEFAULT_ENDPOINTS[config.provider] || '';

  switch (config.provider) {
    case AIProvider.OPENROUTER:
      return await generateOpenRouter(prompt, config.apiKey, endpoint, model, config.imageUrlModel, referenceImage);

    case AIProvider.DEEPSEEK:
      throw new Error('DeepSeek 目前不支持图像生成，请使用其他服务商');

    case AIProvider.VOLCENGINE:
      return await generateVolcEngine(prompt, config.apiKey, endpoint, model, referenceImage);

    case AIProvider.GEMINI:
      return await generateGemini(prompt, config.apiKey, model, referenceImage);

    case AIProvider.CUSTOM:
      return await generateCompatibleChatImageFlow(prompt, config.apiKey, endpoint, model, referenceImage);

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
};

/** 自定义接入：兼容「聊天补全触发工具调用 → /images/generations」一类接口 */
const generateCompatibleChatImageFlow = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string | undefined,
  referenceImage?: string
): Promise<string> => {
  const chatModel = model?.trim();
  if (!chatModel) {
    throw new Error('请在 AI 设置中填写自定义聊天模型名称');
  }
  try {
    const messages: any[] = [
      {
        role: 'user',
        content: `Generate a high-quality 1:1 square pixel art image of ${prompt}. ${PIXEL_ART_PROMPT}`,
      },
    ];

    if (referenceImage) {
      const imageUrl = referenceImage.startsWith('data:')
        ? referenceImage
        : `data:image/jpeg;base64,${referenceImage.split(',')[1]}`;
      messages[0] = {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
          {
            type: 'text',
            text: `Generate a high-quality 1:1 square pixel art based on this image${prompt ? ': ' + prompt : ''}. ${PIXEL_ART_PROMPT}`,
          },
        ],
      };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chatModel,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    return await processToolCallImageResponse(data, baseUrl, apiKey);
  } catch (error) {
    console.error('Custom API image generation error:', error);
    throw error;
  }
};

const processToolCallImageResponse = async (
  data: any,
  baseUrl: string,
  apiKey: string
): Promise<string> => {
  if (data.choices?.[0]?.message?.tool_calls) {
    for (const toolCall of data.choices[0].message.tool_calls) {
      if (toolCall.function.name === 'dalle.text2im') {
        const args = JSON.parse(toolCall.function.arguments);
        if (!args.model) {
          throw new Error('工具调用响应缺少图像模型 ID');
        }

        const imageResponse = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: args.model,
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

const buildOpenRouterUserMessage = (prompt: string, referenceImage?: string) => {
  const text = referenceImage
    ? `Generate a high-quality 1:1 square pixel art based on this image${prompt ? ': ' + prompt : ''}. ${PIXEL_ART_PROMPT}`
    : `Generate a high-quality 1:1 square pixel art image of ${prompt}. ${PIXEL_ART_PROMPT}`;

  if (!referenceImage) {
    return { role: 'user' as const, content: text };
  }

  const imageUrl = referenceImage.startsWith('data:')
    ? referenceImage
    : `data:image/jpeg;base64,${referenceImage.split(',')[1]}`;

  return {
    role: 'user' as const,
    content: [
      { type: 'image_url' as const, image_url: { url: imageUrl } },
      { type: 'text' as const, text },
    ],
  };
};

const parseOpenRouterImageMessage = (data: any): string | null => {
  const message = data.choices?.[0]?.message;
  const images = message?.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const url =
    images[0]?.image_url?.url ??
    images[0]?.imageUrl?.url;
  if (typeof url === 'string' && url.startsWith('data:')) {
    return url;
  }
  return null;
};

const generateOpenRouter = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  imageUrlModel?: string,
  referenceImage?: string
): Promise<string> => {
  try {
    const imageModel = imageUrlModel?.trim() || model || 'black-forest-labs/flux.2-pro';
    const messages = [buildOpenRouterUserMessage(prompt, referenceImage)];

    const imageOnlyModel =
      imageModel.includes('black-forest-labs/') || imageModel.includes('sourceful/');

    const body: Record<string, unknown> = {
      model: imageModel,
      messages,
      modalities: imageOnlyModel ? ['image'] : ['image', 'text'],
      image_config: {
        aspect_ratio: '1:1',
      },
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://pindou.danzaii.cn',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    const fromMessage = parseOpenRouterImageMessage(data);
    if (fromMessage) return fromMessage;

    throw new Error('未从 OpenRouter 返回中解析到图像，请确认所选模型支持图像输出');
  } catch (error) {
    console.error('OpenRouter image generation error:', error);
    throw error;
  }
};

const generateVolcEngine = async (
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string = 'doubao-seedream-4-5-251128',
  referenceImage?: string
): Promise<string> => {
  try {
    const requestBody: any = {
      model,
      size: '2K',
      response_format: 'b64_json',
      n: 1,
      watermark: false,
    };

    if (referenceImage) {
      requestBody.reference_images = [referenceImage];
      requestBody.prompt =
        prompt ||
        'Convert this image to a clean 1:1 square pixel art suitable for Perler beads (hama beads). The style should be clean, vibrant, limited color palette, solid white background, clear and bold outlines, centered subject.';
    } else {
      requestBody.prompt = `A high-quality 1:1 square pixel art of ${prompt}. ${PIXEL_ART_PROMPT}`;
    }

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
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
    const b64Json = data.data?.[0]?.b64_json ?? data.output?.b64_json;
    if (b64Json) {
      return `data:image/png;base64,${b64Json}`;
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
  model: string = 'gemini-2.0-flash-exp',
  referenceImage?: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    if (referenceImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImage.split(',')[1],
        },
      });
      parts.push({
        text: `Convert this image to a clean 1:1 square pixel art suitable for Perler beads (hama beads). ${prompt ? 'Additional guidance: ' + prompt : ''}. The style should be clean, vibrant, limited color palette, solid white background, clear and bold outlines, centered subject.`,
      });
    } else {
      parts.push({
        text: `Generate a high-quality 1:1 square pixel art of ${prompt}. ${PIXEL_ART_PROMPT}`,
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: {
            parts,
          },
          generationConfig: {
            responseModalities: ['text', 'image'],
            imageGenerationConfig: {
              aspectRatio: '1:1',
            },
          },
        }),
      }
    );

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

    throw new Error('No valid image part returned.');
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
      endpoint: endpoint || DEFAULT_ENDPOINTS[provider],
    };
    await generatePixelArtImage('test', config);
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};
