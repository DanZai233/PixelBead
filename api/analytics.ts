import { redis } from '../services/upstashService';

const ANALYTICS_KEY = 'analytics:daily';
const TOTAL_VISITS_KEY = 'analytics:total';

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'POST') {
      const body = await request.json();
      const { path, userAgent } = body;

      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `${ANALYTICS_KEY}:${today}`;

      await redis.incr(TOTAL_VISITS_KEY);
      await redis.hincrby(dailyKey, 'visits', 1);

      if (path) {
        await redis.hincrby(dailyKey, `path:${path}`, 1);
      }

      if (userAgent) {
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
        await redis.hincrby(dailyKey, isMobile ? 'device:mobile' : 'device:desktop', 1);
      }

      await redis.expire(dailyKey, 30 * 24 * 60 * 60);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET') {
      const totalVisits = await redis.get(TOTAL_VISITS_KEY) || 0;

      const keys = await redis.keys(`${ANALYTICS_KEY}:*`);
      const dailyData: Record<string, any> = {};

      for (const key of keys) {
        const date = key.replace(`${ANALYTICS_KEY}:`, '');
        const data = await redis.hgetall(key);
        dailyData[date] = data;
      }

      return new Response(
        JSON.stringify({
          total: Number(totalVisits),
          daily: dailyData,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
