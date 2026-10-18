import { publicRecord } from '../shared/profile.js';
import { HttpError, json, body } from './http.js';

export async function registerAccount(db, owner, nickname = '', bio = '', createdAt = Date.now()) {
  await db.prepare(`INSERT INTO accounts (owner_hash, nickname, bio, created_at, public_id, friend_code)
    VALUES (?, ?, ?, ?, lower(hex(randomblob(16))), upper(hex(randomblob(6))))
    ON CONFLICT(owner_hash) DO UPDATE SET
      public_id = COALESCE(accounts.public_id, excluded.public_id),
      friend_code = COALESCE(accounts.friend_code, excluded.friend_code)`).bind(owner, nickname, bio, createdAt).run();
}

export async function account(db, owner) {
  let row = await db.prepare('SELECT * FROM accounts WHERE owner_hash = ?').bind(owner).first();
  if (!row) {
    const legacy = await db.prepare('SELECT created_at FROM profiles WHERE owner_hash = ? LIMIT 1').bind(owner).first();
    if (!legacy) throw new HttpError(404, '这个身份还没有云端存档，请检查恢复密钥');
    await registerAccount(db, owner, '', '', legacy.created_at);
    row = await db.prepare('SELECT * FROM accounts WHERE owner_hash = ?').bind(owner).first();
  }
  if (!row.public_id || !row.friend_code) {
    // Old workers may create accounts between the additive migration and rollout.
    await registerAccount(db, owner);
    row = await db.prepare('SELECT * FROM accounts WHERE owner_hash = ?').bind(owner).first();
  }
  // A deleted portrait never silently falls back to another snapshot.
  const portrait = row.portrait_id && await db.prepare('SELECT id FROM profiles WHERE id = ? AND owner_hash = ? AND deleted_at IS NULL')
    .bind(row.portrait_id, owner).first();
  return { id: owner.slice(0, 12), publicId: row.public_id, friendCode: row.friend_code,
    nickname: row.nickname, bio: row.bio, createdAt: row.created_at,
    portraitId: portrait ? row.portrait_id : null, friendsVisible: !!portrait && !!row.friends_visible };
}

function person(row) { return { publicId: row.public_id, nickname: row.nickname, bio: row.bio }; }

async function connection(db, owner, id) {
  const row = await db.prepare('SELECT * FROM friendships WHERE id = ? AND (owner_a = ? OR owner_b = ?)').bind(id, owner, owner).first();
  if (!row) throw new HttpError(404, '这条好友申请或关系已不存在，请刷新');
  return row;
}

export async function peopleRoute(request, db, owner, path) {
  if (path === '/api/account') {
    if (request.method === 'GET') return json(await account(db, owner));
    if (request.method === 'POST') {
      const input = await body(request);
      if (typeof input.nickname !== 'string' || input.nickname.trim().length > 24) throw new HttpError(400, '名字最多 24 个字');
      if (input.bio !== undefined && (typeof input.bio !== 'string' || input.bio.trim().length > 80)) throw new HttpError(400, '简介最多 80 个字');
      await registerAccount(db, owner, input.nickname.trim(), input.bio?.trim() || '');
      if (input.bio === undefined) await db.prepare('UPDATE accounts SET nickname = ? WHERE owner_hash = ?').bind(input.nickname.trim(), owner).run();
      else await db.prepare('UPDATE accounts SET nickname = ?, bio = ? WHERE owner_hash = ?').bind(input.nickname.trim(), input.bio.trim(), owner).run();
      return json(await account(db, owner));
    }
  }
  if (path === '/api/account/portrait' && request.method === 'PUT') {
    await account(db, owner);
    const input = await body(request);
    if ((input.portraitId !== null && !/^[\w-]{1,80}$/.test(input.portraitId || '')) || typeof input.friendsVisible !== 'boolean') throw new HttpError(400, '请选择画像及可见范围');
    if (input.portraitId !== null) {
      const row = await db.prepare('SELECT id FROM profiles WHERE id = ? AND owner_hash = ? AND deleted_at IS NULL').bind(input.portraitId, owner).first();
      if (!row) throw new HttpError(404, '这份画像没有可用的云端副本，请先同步');
    }
    const saved = await db.prepare(`UPDATE accounts SET portrait_id = ?, friends_visible = ? WHERE owner_hash = ?
      AND (? IS NULL OR EXISTS(SELECT 1 FROM profiles WHERE id = ? AND owner_hash = ? AND deleted_at IS NULL)) RETURNING owner_hash`)
      .bind(input.portraitId, input.portraitId && input.friendsVisible ? 1 : 0, owner, input.portraitId, input.portraitId, owner).first();
    if (!saved) throw new HttpError(404, '这份画像已移除，请重新选择');
    return json(await account(db, owner));
  }
  if (!path.startsWith('/api/friends') && !path.startsWith('/api/people/')) return null;
  await account(db, owner);
  const lookup = path.match(/^\/api\/people\/by-code\/([A-Fa-f0-9-]{12,14})$/);
  if (lookup && request.method === 'GET') {
    const code = lookup[1].replaceAll('-', '').toUpperCase();
    const row = await db.prepare('SELECT public_id, nickname, bio FROM accounts WHERE friend_code = ?').bind(code).first();
    if (!row) throw new HttpError(404, '没有找到这个好友码，请检查后再试');
    return json(person(row));
  }
  if (path === '/api/friends' && request.method === 'GET') {
    const { results } = await db.prepare(`SELECT f.id, f.status, f.requester, f.created_at, f.accepted_at,
      a.public_id, a.nickname, a.bio FROM friendships f JOIN accounts a
      ON a.owner_hash = CASE WHEN f.owner_a = ? THEN f.owner_b ELSE f.owner_a END
      WHERE f.owner_a = ? OR f.owner_b = ? ORDER BY f.created_at DESC`).bind(owner, owner, owner).all();
    return json({ connections: results.map((r) => ({ id: r.id, status: r.status,
      direction: r.requester === owner ? 'outgoing' : 'incoming', person: person(r), createdAt: r.created_at, acceptedAt: r.accepted_at })) });
  }
  if (path === '/api/friends' && request.method === 'POST') {
    const input = await body(request);
    if (!/^[a-f0-9]{32}$/.test(input.publicId || '')) throw new HttpError(400, '好友标识不正确');
    const target = await db.prepare('SELECT owner_hash FROM accounts WHERE public_id = ?').bind(input.publicId).first();
    if (!target) throw new HttpError(404, '这个身份已不存在');
    if (target.owner_hash === owner) throw new HttpError(400, '这是你自己的好友码');
    const [a, b] = [owner, target.owner_hash].sort();
    await db.prepare(`INSERT INTO friendships (id, owner_a, owner_b, requester, created_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(owner_a, owner_b) DO NOTHING`)
      .bind(crypto.randomUUID().replaceAll('-', ''), a, b, owner, Date.now()).run();
    const row = await db.prepare('SELECT id, status, requester FROM friendships WHERE owner_a = ? AND owner_b = ?').bind(a, b).first();
    return json({ id: row.id, status: row.status, direction: row.requester === owner ? 'outgoing' : 'incoming' });
  }
  const action = path.match(/^\/api\/friends\/([a-f0-9]{32})(\/accept)?$/);
  if (action && (request.method === 'POST' || request.method === 'DELETE')) {
    const row = await connection(db, owner, action[1]);
    if (action[2] && request.method === 'POST') {
      if (row.requester === owner) throw new HttpError(403, '需要对方接受这条申请');
      const accepted = await db.prepare("UPDATE friendships SET status = 'accepted', accepted_at = COALESCE(accepted_at, ?) WHERE id = ? AND requester != ? RETURNING id")
        .bind(Date.now(), row.id, owner).first();
      if (!accepted) throw new HttpError(404, '这条申请已被取消，请刷新');
      return json({ accepted: true });
    }
    if (!action[2] && request.method === 'DELETE') {
      await db.prepare('DELETE FROM friendships WHERE id = ?').bind(row.id).run();
      return json({ removed: true });
    }
  }
  const profile = path.match(/^\/api\/friends\/([a-f0-9]{32})\/profile$/);
  if (profile && request.method === 'GET') {
    // Permission and projection are read in one query, including concurrent revocation.
    const row = await db.prepare(`SELECT a.public_id, a.nickname AS person_name, a.bio, p.*
      FROM accounts a JOIN friendships f ON f.status = 'accepted'
      AND ((f.owner_a = ? AND f.owner_b = a.owner_hash) OR (f.owner_b = ? AND f.owner_a = a.owner_hash))
      LEFT JOIN profiles p ON p.id = a.portrait_id AND p.owner_hash = a.owner_hash AND p.deleted_at IS NULL AND a.friends_visible = 1
      WHERE a.public_id = ?`).bind(owner, owner, profile[1]).first();
    if (!row) throw new HttpError(403, '你们还不是好友，或这段连接已经解除');
    return json({ person: { publicId: row.public_id, nickname: row.person_name, bio: row.bio }, portrait: row.id ? publicRecord({
      id: row.id, createdAt: row.created_at, engineVersion: row.engine_version, questionVersion: row.question_version,
      answerCount: row.answer_count, nickname: row.person_name, result: JSON.parse(row.result_json),
    }) : null });
  }
  throw new HttpError(404, '接口不存在');
}
