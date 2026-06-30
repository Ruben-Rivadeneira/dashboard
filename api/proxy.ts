import type { VercelRequest, VercelResponse } from '@vercel/node';

const TARGET = 'https://gruponuveto-aws.i6.inconcert.cloud/inconcert/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // El path real viene en el query param: /api/proxy?path=/login/
  const path = (req.query.path as string) || '/';

  // Headers CORS para el browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Construir headers para el request al servidor real
  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    forwardHeaders['Authorization'] = req.headers.authorization as string;
  }

  try {
    const response = await fetch(`${TARGET}${path}`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[proxy] Error:', err);
    return res.status(502).json({ error: 'Bad gateway', detail: String(err) });
  }
}
