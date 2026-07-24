import type { VercelRequest, VercelResponse } from '@vercel/node';

const TARGET = 'https://gruponuveto-aws.i6.inconcert.cloud/inconcert/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const path = (req.query.path as string) || '/';
  const forwardHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) {
    forwardHeaders['Authorization'] = req.headers.authorization as string;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch(`${TARGET}${path}`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: unknown) {
    console.error('[proxy] Error:', err);
    const isTimeout = err instanceof Error &&
      (err.message.includes('timeout') || err.name === 'AbortError');
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Gateway timeout' : 'Bad gateway',
      detail: String(err),
    });
  }
}
