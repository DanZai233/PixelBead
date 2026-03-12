import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createToken } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminPassword) {
    return res.status(500).json({ error: '后台未配置管理员密码' });
  }

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = createToken(username);
  return res.status(200).json({ token, username });
}
