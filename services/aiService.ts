/**
 * 调用服务端「拼豆智能生成」接口（密钥仅部署环境配置，客户端不包含任何第三方 AI 配置）
 *
 * 说明：Capacitor / 本地静态包里没有 /api，必须用完整域名。
 * 优先 VITE_AI_GENERATE_URL；否则与素材广场一致使用 VITE_API_BASE_URL（见 .env.capacitor）。
 */
const resolveGenerateUrl = (): string => {
  const aiBase = (import.meta.env.VITE_AI_GENERATE_URL as string | undefined)?.trim();
  if (aiBase) {
    return `${aiBase.replace(/\/$/, '')}/api/ai/generate-image`;
  }
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (apiBase) {
    return `${apiBase.replace(/\/$/, '')}/api/ai/generate-image`;
  }
  return '/api/ai/generate-image';
};

export const generatePixelArtImage = async (
  prompt: string,
  referenceImage?: string | null
): Promise<string> => {
  const url = resolveGenerateUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt || '',
      referenceImage: referenceImage || undefined,
    }),
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(
      '无法连接生成服务。若在 App 内使用，请用 .env.capacitor 配置 VITE_API_BASE_URL（与线上域名一致）后重新打包同步。'
    );
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string; imageDataUrl?: string };

  if (!res.ok) {
    throw new Error(data.error || `生成失败（${res.status}）`);
  }
  if (!data.imageDataUrl) {
    throw new Error(data.error || '未返回图像数据');
  }
  return data.imageDataUrl;
};
