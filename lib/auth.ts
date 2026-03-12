import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createToken(username: string): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  const payload = JSON.stringify({ user: username, exp: Date.now() + TOKEN_EXPIRY_MS });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64') + '.' + sig;
  return token;
}

export function verifyToken(token: string): { user: string; exp: number } | null {
  try {
    const secret = process.env.ADMIN_PASSWORD || '';
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

    if (sig !== expectedSig) return null;

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return null;

    return data;
  } catch {
    return null;
  }
}

export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    return handler(req, res);
  };
}
