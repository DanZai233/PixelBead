import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

function createToken(username: string): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  const payload = JSON.stringify({ user: username, exp: Date.now() + 86400000 });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + sig;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (!adminPassword) return res.status(500).json({ error: '后台未配置管理员密码' });
    if (username !== adminUsername || password !== adminPassword) return res.status(401).json({ error: '用户名或密码错误' });
    return res.status(200).json({ token: createToken(username), username });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || '登录失败' });
  }
}
