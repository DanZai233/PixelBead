import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAiDb, imageBucket, requestInfo, storeImage } from '../../server/aiRecords.js';
import type { Db, ObjectId } from 'mongodb';

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

  const clientInfo = requestInfo(req);
  // Rate limit: max 20 req/min per IP
  {
    const clientIp = clientInfo.ip;
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
  const baseUrl = (process.env.PIXELBEAD_AI_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
  const model = process.env.PIXELBEAD_AI_IMAGE_MODEL || 'doubao-seedream-5-0-260128';

  if (!apiKey?.trim()) {
    return res.status(503).json({ error: '智能生成功能暂未开放' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  } catch {
    return res.status(400).json({ error: '请求格式不正确' });
  }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const referenceImage = typeof body.referenceImage === 'string' ? body.referenceImage.trim() : '';

  if (!prompt && !referenceImage) {
    return res.status(400).json({ error: '请输入描述或上传参考图' });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: '描述过长' });
  }
  if (referenceImage && (!/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(referenceImage)
    || referenceImage.length > 6 * 1024 * 1024)) {
    return res.status(400).json({ error: '参考图格式不支持或图片过大，请使用 PNG、JPEG 或 WebP 图片' });
  }

  const startedAt = Date.now();
  let db: Db;
  let recordId: ObjectId;
  let referenceImageId: ObjectId | undefined;
  try {
    db = await getAiDb();
    if (referenceImage) referenceImageId = await storeImage(db, referenceImage, 'reference');
    const record = await db.collection('ai_generations').insertOne({
      prompt, model, mode: referenceImage ? 'image' : 'text',
      referenceImageId, createdAt: startedAt, status: 'pending',
      request: clientInfo,
    });
    recordId = record.insertedId;
  } catch {
    if (referenceImageId && db) {
      await imageBucket(db).delete(referenceImageId).catch(() => {});
    }
    console.error('AI record initialization failed');
    return res.status(503).json({ error: '智能生成暂时不可用，请稍后重试' });
  }

  const fail = async (error: string) => {
    await db.collection('ai_generations').updateOne({ _id: recordId }, {
      $set: { status: 'failed', error, durationMs: Date.now() - startedAt },
    }).catch(() => console.error('AI failure record update failed'));
    return res.status(502).json({ error });
  };

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
      signal: AbortSignal.timeout(90_000),
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
      return await fail('生成服务暂时不可用，请稍后重试');
    }

    if (!upstream.ok) {
      return await fail(mapUpstreamError(data));
    }

    const firstImage = data.data?.[0];
    let b64Json = firstImage?.b64_json ?? data.output?.b64_json;
    if (!b64Json) {
      return await fail('未获取到图像，请重试');
    }

    const imageDataUrl = `data:image/png;base64,${b64Json}`;
    let imageId: ObjectId | undefined;
    try {
      imageId = await storeImage(db, imageDataUrl, `${recordId}-generated`);
      await db.collection('ai_generations').updateOne({ _id: recordId }, {
        $set: { status: 'success', imageId, durationMs: Date.now() - startedAt },
      });
    } catch {
      await db.collection('ai_generations').updateOne({ _id: recordId }, {
        $set: {
          status: 'archive_failed', error: '生成成功，但生成图片云端保存失败',
          ...(imageId ? { imageId } : {}), durationMs: Date.now() - startedAt,
        },
      }).catch(() => console.error('AI archive failure record update failed'));
      console.error('AI image archive failed');
    }
    return res.status(200).json({
      imageDataUrl,
    });
  } catch {
    return await fail('生成服务暂时不可用，请稍后重试');
  }
}
