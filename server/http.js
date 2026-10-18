export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  } });
}

export async function body(request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) throw new HttpError(415, '请使用 JSON 提交');
  const text = await request.text();
  if (text.length > 256_000) throw new HttpError(413, '画像数据过大');
  let input;
  try { input = JSON.parse(text); } catch { throw new HttpError(400, '数据格式不正确'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, '数据格式不正确');
  return input;
}
