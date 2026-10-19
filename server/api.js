import { publicRecord, publicResult } from '../shared/profile.js';

import { HttpError, json, body } from './http.js';
import { metricsRoute } from './metrics.js';
import { registerAccount, peopleRoute } from './people.js';

async function ownerHash(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401, '无法识别本机身份，请刷新页面后重试');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromRow(row) {
  return {
    id: row.local_id || row.id, cloudId: row.id, createdAt: row.created_at,
    engineVersion: row.engine_version, questionVersion: row.question_version,
    answerCount: row.answer_count, answers: JSON.parse(row.answers_json),
    result: JSON.parse(row.result_json), nickname: row.nickname, shareId: row.share_id,
  };
}

function summaryFromRow(row) {
  return {
    id: row.local_id || row.id, cloudId: row.id, createdAt: row.created_at,
    engineVersion: row.engine_version, questionVersion: row.question_version,
    answerCount: row.answer_count, nickname: row.nickname, shareId: row.share_id,
    preview: { title: row.preview_title, symbol: row.preview_symbol },
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
    return json(publicRecord({ ...fromRow(row), id: row.id }));
  }

  const anonymous = await metricsRoute(request, env, path);
  if (anonymous) return anonymous;

  const owner = await ownerHash(request);
  const people = await peopleRoute(request, env.DB, owner, path);
  if (people) return people;
  if (path === '/api/records' && request.method === 'GET') {
    if (new URL(request.url).searchParams.get('summary') === '1') {
      const { results } = await env.DB.prepare(`SELECT id, local_id, created_at, engine_version, question_version,
        answer_count, nickname, share_id, json_extract(result_json, '$.archetype.title') AS preview_title,
        json_extract(result_json, '$.archetype.symbol') AS preview_symbol FROM profiles
        WHERE owner_hash = ? AND deleted_at IS NULL ORDER BY created_at DESC`).bind(owner).all();
      return json({ records: results.map(summaryFromRow) });
    }
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
    const localId = input.localId || id;
    if (typeof localId !== 'string' || !/^[\w-]{1,80}$/.test(localId)) throw new HttpError(400, '本机记录标识不正确');
    const answerCount = Object.keys(input.answers).length;
    if (answerCount < 10 || answerCount > 200) throw new HttpError(400, '作答数量不正确');
    const accountNickname = input.accountNickname ?? '';
    if (typeof accountNickname !== 'string' || accountNickname.trim().length > 24) throw new HttpError(400, '昵称最多 24 个字');
    const accountBio = input.accountBio ?? '';
    if (typeof accountBio !== 'string' || accountBio.trim().length > 80) throw new HttpError(400, '简介最多 80 个字');
    // Immutable, idempotent snapshots. A timed-out retry cannot overwrite a result.
    await registerAccount(env.DB, owner, accountNickname.trim(), accountBio.trim());
    await env.DB.prepare(`INSERT INTO profiles
      (id, owner_hash, created_at, engine_version, question_version, answer_count, answers_json, result_json, local_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`)
      .bind(id, owner, input.createdAt, input.engineVersion, input.questionVersion, answerCount,
        JSON.stringify(input.answers), JSON.stringify(result), localId).run();
    // A still-open old client can write rows without local_id between migration and deployment.
    const saved = await env.DB.prepare('SELECT * FROM profiles WHERE owner_hash = ? AND COALESCE(local_id, id) = ? AND deleted_at IS NULL')
      .bind(owner, localId).first();
    if (!saved) throw new HttpError(404, '云端副本已移除，请刷新状态后重新同步');
    return json(fromRow(saved));
  }
  const row = await ownedRecord(env.DB, id, owner);
  if (!share && request.method === 'GET') return json(fromRow(row));
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
    await env.DB.prepare('UPDATE profiles SET share_id = COALESCE(share_id, ?), nickname = ? WHERE id = ? AND owner_hash = ? AND deleted_at IS NULL')
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
  const resource = path.startsWith('/api/admin/') ? 'admin'
    : path.startsWith('/api/metrics/') ? 'anonymous_metrics'
    : path.startsWith('/api/shares/') ? 'public_profile'
    : path.endsWith('/share') ? 'share_settings' : 'private_records';
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
