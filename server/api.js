import { publicRecord, publicResult } from '../shared/profile.js';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  } });
}

async function ownerHash(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401, '无法识别本机身份，请刷新页面后重试');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function body(request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw new HttpError(415, '请使用 JSON 提交');
  }
  const text = await request.text();
  if (text.length > 256_000) throw new HttpError(413, '画像数据过大');
  try { return JSON.parse(text); } catch { throw new HttpError(400, '数据格式不正确'); }
}

function fromRow(row) {
  return {
    id: row.id, createdAt: row.created_at,
    engineVersion: row.engine_version, questionVersion: row.question_version,
    answerCount: row.answer_count, answers: JSON.parse(row.answers_json),
    result: JSON.parse(row.result_json), nickname: row.nickname, shareId: row.share_id,
  };
}

async function ownedRecord(db, id, owner) {
  const row = await db.prepare('SELECT * FROM profiles WHERE id = ? AND owner_hash = ? AND deleted_at IS NULL').bind(id, owner).first();
  if (!row) throw new HttpError(404, '记录不存在');
  return row;
}

async function route(request, env) {
  if (!env.DB) throw new HttpError(503, '云端存档暂未配置，本机画像仍可正常使用');
  const path = new URL(request.url).pathname;
  const shared = path.match(/^\/api\/shares\/([a-f0-9]{32})$/);
  if (shared && request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM profiles WHERE share_id = ?').bind(shared[1]).first();
    if (!row) throw new HttpError(404, '这份画像未公开，或分享已撤销');
    return json(publicRecord(fromRow(row)));
  }

  const owner = await ownerHash(request);
  if (path === '/api/records' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM profiles WHERE owner_hash = ? AND deleted_at IS NULL ORDER BY created_at DESC').bind(owner).all();
    return json({ records: results.map(fromRow) });
  }
  const match = path.match(/^\/api\/records\/([\w-]{1,80})(\/share)?$/);
  if (!match) throw new HttpError(404, '接口不存在');
  const [, id, share] = match;
  if (!share && request.method === 'PUT') {
    const input = await body(request);
    let result;
    try { result = publicResult(input.result); } catch (error) { throw new HttpError(400, error.message); }
    if (!Number.isSafeInteger(input.createdAt) || input.createdAt <= 0 ||
        !/^[\w.-]{1,80}$/.test(input.engineVersion || '') || !/^[\w.-]{1,80}$/.test(input.questionVersion || '') ||
        !input.answers || typeof input.answers !== 'object') {
      throw new HttpError(400, '存档格式不正确');
    }
    const answerCount = Object.keys(input.answers).length;
    if (answerCount < 10 || answerCount > 200) throw new HttpError(400, '作答数量不正确');
    // Immutable, idempotent snapshots. A timed-out retry cannot overwrite a result.
    await env.DB.prepare(`INSERT INTO profiles
      (id, owner_hash, created_at, engine_version, question_version, answer_count, answers_json, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`)
      .bind(id, owner, input.createdAt, input.engineVersion, input.questionVersion, answerCount,
        JSON.stringify(input.answers), JSON.stringify(result)).run();
    return json(fromRow(await ownedRecord(env.DB, id, owner)));
  }
  await ownedRecord(env.DB, id, owner);
  if (!share && request.method === 'DELETE') {
    // A minimal tombstone prevents a delayed upload from recreating deleted data.
    await env.DB.prepare("UPDATE profiles SET deleted_at = ?, answers_json = '{}', result_json = '{}', nickname = '', share_id = NULL WHERE id = ? AND owner_hash = ?")
      .bind(Date.now(), id, owner).run();
    return json({ deleted: true });
  }
  if (share && request.method === 'POST') {
    const input = await body(request);
    if (typeof input.nickname !== 'string' || input.nickname.trim().length > 24) {
      throw new HttpError(400, '昵称最多 24 个字');
    }
    const shareId = crypto.randomUUID().replaceAll('-', '');
    await env.DB.prepare('UPDATE profiles SET share_id = COALESCE(share_id, ?), nickname = ? WHERE id = ? AND owner_hash = ?')
      .bind(shareId, input.nickname.trim(), id, owner).run();
    return json(fromRow(await ownedRecord(env.DB, id, owner)));
  }
  if (share && request.method === 'DELETE') {
    await env.DB.prepare('UPDATE profiles SET share_id = NULL WHERE id = ? AND owner_hash = ?').bind(id, owner).run();
    return json({ revoked: true });
  }
  throw new HttpError(405, '不支持此操作');
}

export async function handleRequest(request, env) {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const path = new URL(request.url).pathname;
  const resource = path.startsWith('/api/shares/') ? 'public_profile' : path.endsWith('/share') ? 'share_settings' : 'private_records';
  let response;
  try { response = await route(request, env); } catch (error) {
    const status = error.status || 503;
    response = json({ message: error.status ? error.message : '云端暂不可用，请稍后重试', requestId }, status);
  }
  response.headers.set('X-Request-Id', requestId);
  // No URLs, answer bodies, tokens or share identifiers in application logs.
  console.log(JSON.stringify({ requestId, resource, method: request.method, status: response.status, durationMs: Date.now() - started }));
  return response;
}
