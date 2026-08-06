import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 服务端图像生成（密钥与上游地址仅环境变量，不暴露给客户端）
 * Vercel 环境变量：
 *   PIXELBEAD_AI_API_KEY      — 必填，Bearer Token
 *   PIXELBEAD_AI_API_BASE     — 可选，不填则使用代码内默认基地址
 *   PIXELBEAD_AI_IMAGE_MODEL  — 可选，不填则使用代码内默认模型 ID
 */
const PIXEL_ART_STYLE =
  'Pixel art composed of uniform square blocks of identical size. ' +
  'Pixels are solid-filled pure color squares with no gaps, no grid lines, no borders, ' +
  'and no separators between them. Pixels sit flush against each other. ' +
  'Clean flat colors, no gradients, no shading. ' +
  'Limited color palette, vibrant and bright. ' +
  'Solid plain white background. Centered subject.';
const IMG2IMG_DEFAULT =
  'Convert this image into a clean 1:1 pixel art composed of uniform square blocks. ' +
  'Use solid-filled pure color squares with no gaps, grid lines, or borders between pixels. ' +
  'Flat colors only, no gradients. Solid white background. Limited palette. Centered subject.';

interface SeedreamImageItem {
  b64_json?: string;
  url?: string;
  size?: string;
}

function mapUpstreamError(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const err = (error as { error?: { message?: string } }).error;
    const message = err?.message?.toLowerCase() ?? '';
    if (message.includes('api key') || message.includes('unauthorized')) {
      return '服务鉴权失败';
    }
    if (message.includes('quota') || message.includes('limit') || message.includes('rate')) {
      return '当前使用人数较多，请稍后再试';
    }
    if (message.includes('content_filter')) {
      return '内容未通过安全校验，请修改描述后重试';
    }
    if (err?.message) return '生成失败，请稍后重试';
  }
  return '生成服务暂时不可用，请稍后重试';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: max 20 req/min per IP
  {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    if (!(globalThis as any)._pixelbeadRateStore) (globalThis as any)._pixelbeadRateStore = new Map();
    const rs = (globalThis as any)._pixelbeadRateStore as Map<string, { count: number; resetAt: number }>;
    const now = Date.now();
    const entry = rs.get(clientIp);
    if (entry && now <= entry.resetAt && entry.count >= 20) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
    if (!entry || now > entry.resetAt) {
      rs.set(clientIp, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count++;
    }
  }

  const apiKey = process.env.PIXELBEAD_AI_API_KEY;
  const baseUrl = (process.env.PIXELBEAD_AI_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(//$/, '');
  const model = process.env.PIXELBEAD_AI_IMAGE_MODEL || 'doubao-seedream-5-0-260128';

  if (!apiKey?.trim()) {
    return res.status(503).json({ error: '智能生成功能暂未开放' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const referenceImage = typeof body.referenceImage === 'string' ? body.referenceImage.trim() : '';

  if (!prompt && !referenceImage) {
    return res.status(400).json({ error: '请输入描述或上传参考图' });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: '描述过长' });
  }


  const requestBody: Record<string, unknown> = {
    model,
    size: '2K',
    response_format: 'b64_json',
    sequential_image_generation: 'disabled',
    watermark: false,
  };

  if (referenceImage) {
    requestBody.image = referenceImage;
    requestBody.prompt = prompt || IMG2IMG_DEFAULT;
  } else {
    requestBody.prompt = `A 1:1 square pixel art of ${prompt}. ${PIXEL_ART_STYLE}`;
  }

  try {
    const upstream = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await upstream.text();
    let data: {
      data?: SeedreamImageItem[];
      output?: { b64_json?: string };
      error?: { message?: string; code?: string };
    };
    try {
      data = JSON.parse(responseText) as typeof data;
    } catch {
      return res.status(502).json({ error: '生成服务暂时不可用，请稍后重试' });
    }

    console.error('Seedream upstream status:', upstream.status, 'body sample:', responseText.slice(0, 300));

    if (!upstream.ok) {
      return res.status(502).json({ error: mapUpstreamError(data) });
    }

    const firstImage = data.data?.[0];
    let b64Json = firstImage?.b64_json ?? data.output?.b64_json;
    if (!b64Json) {
      return res.status(502).json({ error: '未获取到图像，请重试' });
    }

    return res.status(200).json({
      imageDataUrl: `data:image/png;base64,${b64Json}`,
    });
  } catch {
    return res.status(502).json({ error: '生成服务暂时不可用，请稍后重试' });
  }
}
