import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 服务端图像生成（密钥与上游地址仅环境变量，不暴露给客户端）
 * Vercel 环境变量：
 *   PIXELBEAD_AI_API_KEY      — 必填，Bearer Token
 *   PIXELBEAD_AI_API_BASE     — 可选，不填则使用代码内默认基地址
 *   PIXELBEAD_AI_IMAGE_MODEL  — 可选，不填则使用代码内默认模型 ID
 */
const PIXEL_ART_PROMPT =
  'The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.';

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

  const apiKey = process.env.PIXELBEAD_AI_API_KEY;
  const baseUrl = (process.env.PIXELBEAD_AI_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
  const model = process.env.PIXELBEAD_AI_IMAGE_MODEL || 'doubao-seedream-4-5-251128';

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

  try {
    const upstream = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const text = await upstream.text();
    let data: { data?: { b64_json?: string }[]; output?: { b64_json?: string }; error?: { message?: string } };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return res.status(502).json({ error: '生成服务暂时不可用，请稍后重试' });
    }

    if (!upstream.ok) {
      return res.status(502).json({ error: mapUpstreamError(data) });
    }

    const b64Json = data.data?.[0]?.b64_json ?? data.output?.b64_json;
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
