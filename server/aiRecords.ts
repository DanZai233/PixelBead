import { Db, GridFSBucket, MongoClient, ObjectId } from 'mongodb';
import type { VercelRequest } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

let connection: Promise<Db> | undefined;

export function getAiDb(): Promise<Db> {
  if (!connection) {
    connection = (async () => {
      if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI');
      const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db('pixelbead');
      await db.collection('ai_generations').createIndex({ createdAt: -1, _id: -1 });
      await db.collection('ai_generations').createIndex({ 'request.ip': 1, createdAt: -1 });
      return db;
    })().catch(error => { connection = undefined; throw error; });
  }
  return connection;
}

export function imageBucket(db: Db) {
  return new GridFSBucket(db, { bucketName: 'ai_images' });
}

export async function storeImage(db: Db, dataUrl: string, name: string): Promise<ObjectId> {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new Error('Unsupported image data');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 24 * 1024 * 1024) throw new Error('Image size out of range');
  const upload = imageBucket(db).openUploadStream(name, { metadata: { contentType: match[1] } });
  try {
    await pipeline(Readable.from([bytes]), upload);
    return upload.id;
  } catch (error) {
    await imageBucket(db).delete(upload.id).catch(() => {});
    throw error;
  }
}

export function requestInfo(req: VercelRequest) {
  const header = (name: string, limit = 1000) => {
    const value = req.headers[name];
    return (Array.isArray(value) ? value[0] : value || '').slice(0, limit);
  };
  return {
    ip: (header('x-vercel-forwarded-for') || header('x-forwarded-for')).split(',')[0].trim()
      || req.socket?.remoteAddress || 'unknown',
    userAgent: header('user-agent'),
    platform: header('sec-ch-ua-platform', 100),
    mobile: header('sec-ch-ua-mobile', 10),
    language: header('accept-language', 200),
    country: header('x-vercel-ip-country', 100),
    region: header('x-vercel-ip-country-region', 100),
    city: header('x-vercel-ip-city', 200),
  };
}

export function verifyAdmin(req: VercelRequest): boolean {
  try {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret || !req.headers.authorization?.startsWith('Bearer ')) return false;
    const parts = req.headers.authorization.slice(7).split('.');
    if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return false;
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const expected = createHmac('sha256', secret).update(payload).digest();
    if (!timingSafeEqual(expected, Buffer.from(parts[1], 'hex'))) return false;
    const data = JSON.parse(payload);
    return data.user === (process.env.ADMIN_USERNAME || 'admin')
      && typeof data.exp === 'number' && Date.now() <= data.exp;
  } catch { return false; }
}
