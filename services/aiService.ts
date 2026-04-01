/**
 * 调用服务端「拼豆智能生成」接口（密钥仅部署环境配置，客户端不包含任何第三方 AI 配置）
 */
const resolveGenerateUrl = (): string => {
  const fromEnv = import.meta.env.VITE_AI_GENERATE_URL as string | undefined;
  if (fromEnv?.trim()) {
    return `${fromEnv.replace(/\/$/, '')}/api/ai/generate-image`;
  }
  return '/api/ai/generate-image';
};

export const generatePixelArtImage = async (
  prompt: string,
  referenceImage?: string | null
): Promise<string> => {
  const res = await fetch(resolveGenerateUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt || '',
      referenceImage: referenceImage || undefined,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; imageDataUrl?: string };

  if (!res.ok) {
    throw new Error(data.error || `生成失败（${res.status}）`);
  }
  if (!data.imageDataUrl) {
    throw new Error(data.error || '未返回图像数据');
  }
  return data.imageDataUrl;
};
