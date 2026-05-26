import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(7);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1_000_000) {
      return res.status(413).json({ error: 'payload_too_large' });
    }

    const { title, content, images, sourceLanguage, slug } = req.body || {};

    if (!title || !content || !sourceLanguage || !slug) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const token = generateToken();
    await redis.set(`share:${token}`, {
      title,
      content,
      images: images || {},
      sourceLanguage,
      slug,
      sharedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      url: `/read/${slug}-${token}`,
      token,
    });
  }

  if (req.method === 'GET') {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'missing_token' });
    }

    const payload = await redis.get(`share:${token}`);
    if (!payload) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.status(200).json({ ...payload, token });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
