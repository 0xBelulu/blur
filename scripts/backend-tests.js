import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { handleRequest } from '../server/api.js';
import { generateResult } from '../src/utils/blurEngine.js';
import { questions } from '../src/data/questions.js';
import { publicResult, ENGINE_VERSION, QUESTION_VERSION, canCompare } from '../shared/profile.js';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord, updateHistoryRecord, removeLocalRecord, CLOUD_SESSION } from '../src/utils/historyStorage.js';
import { syncRecord, publishRecord, revokeShare, removeCloudCopy, flushPending, refreshCloudHistory, downloadRecord, saveNickname, saveProfile, exportRecoveryKey, restoreIdentity } from '../src/utils/cloud.js';
import { selectPortrait, readPeople, friendAction, savePrivacy, resetFriendCode, saveResultVisibility, syncDefaultPortrait } from '../src/utils/people.js';
import { displayRecord } from '../src/utils/portraits.js';
import { compareDimensions } from '../src/utils/comparison.js';
import { comparisonPrompts } from '../src/utils/comparisonPrompts.js';
import { getIdentityToken, getAccountInfo, formatRecoveryKey, identityId, ensureLocalIdentity, updateAccountInfo } from '../src/utils/identity.js';
import { recordStatus } from '../src/utils/recordStatus.js';

// Execute production SQL against real SQLite through the small D1 statement API.
function adapter(sqlite) {
  return { prepare(sql) {
    const statement = sqlite.prepare(sql);
    return { bind(...args) {
      return {
        async first() { return statement.get(...args) || null; },
        async all() { return { results: statement.all(...args) }; },
        async run() { return statement.run(...args); },
      };
    } };
  } };
}

function database(t, legacy = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_profiles.sql', import.meta.url), 'utf8'));
  if (!legacy) {
    sqlite.exec(readFileSync(new URL('../migrations/0002_accounts.sql', import.meta.url), 'utf8'));
    sqlite.exec(readFileSync(new URL('../migrations/0003_people.sql', import.meta.url), 'utf8'));
    sqlite.exec(readFileSync(new URL('../migrations/0004_privacy.sql', import.meta.url), 'utf8'));
    sqlite.exec(readFileSync(new URL('../migrations/0005_result_permissions.sql', import.meta.url), 'utf8'));
    sqlite.exec(readFileSync(new URL('../migrations/0006_metrics.sql', import.meta.url), 'utf8'));
    sqlite.exec(readFileSync(new URL('../migrations/0007_admin_tokens.sql', import.meta.url), 'utf8'));
  }
  t.after(() => sqlite.close());
  return { sqlite, ...adapter(sqlite) };
}

const answers = questions.slice(0, 10).map((q) => ({ questionId: q.id, type: q.type, optionId: q.options[0].id }));
const result = generateResult(answers);
const record = { createdAt: Date.now(), engineVersion: ENGINE_VERSION, questionVersion: QUESTION_VERSION, answers, result };
const alice = 'a'.repeat(64);
const bob = 'b'.repeat(64);

async function call(db, path, method = 'GET', body, token = alice) {
  const response = await handleRequest(new Request(`https://blur.test/api${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { DB: db });
  return { status: response.status, data: await response.json(), headers: response.headers };
}

test('private snapshots are immutable and isolated by owner', async (t) => {
  const db = database(t);
  assert.equal((await call(db, '/records/test', 'PUT', record)).status, 200);
  const changed = { ...record, result: { ...result, archetype: { ...result.archetype, title: 'changed' } } };
  assert.equal((await call(db, '/records/test', 'PUT', changed)).data.result.archetype.title, result.archetype.title);
  assert.equal((await call(db, '/records/test', 'PUT', record, bob)).status, 404);
  assert.equal((await call(db, '/records/test', 'DELETE', undefined, bob)).status, 404);
  assert.equal((await call(db, '/records', 'GET', undefined, bob)).data.records.length, 0);
  const list = await call(db, '/records');
  assert.deepEqual(list.data.records[0].answers, answers);
  assert.equal(list.headers.get('Cache-Control'), 'no-store');
});

test('sharing is idempotent, public projection excludes private nested fields', async (t) => {
  const db = database(t);
  const polluted = structuredClone(record);
  polluted.result.archetype.rawAnswers = ['secret'];
  polluted.result.similarities[0].profile.ownerToken = 'secret';
  await call(db, '/records/test', 'PUT', polluted);
  const first = await call(db, '/records/test/share', 'POST', { nickname: '小林' });
  const second = await call(db, '/records/test/share', 'POST', { nickname: '小林' });
  assert.equal(first.data.shareId, second.data.shareId);
  const shared = await call(db, `/shares/${first.data.shareId}`, 'GET', undefined, '');
  assert.equal(shared.status, 200);
  assert.equal(shared.data.nickname, '小林');
  const text = JSON.stringify(shared.data);
  for (const field of ['answers', 'rawAnswers', 'ownerToken', 'owner_hash', 'shareId']) assert.ok(!text.includes(`"${field}"`));
  assert.equal(shared.data.result.archetype.title, result.archetype.title);
  assert.equal(shared.data.answerCount, 10);
});

test('revoking takes effect immediately and republishing cannot restore an old link', async (t) => {
  const db = database(t);
  await call(db, '/records/test', 'PUT', record);
  const { data: first } = await call(db, '/records/test/share', 'POST', { nickname: '' });
  assert.equal((await call(db, '/records/test/share', 'DELETE', undefined, bob)).status, 404);
  await call(db, '/records/test/share', 'DELETE');
  assert.equal((await call(db, `/shares/${first.shareId}`)).status, 404);
  const { data: second } = await call(db, '/records/test/share', 'POST', { nickname: '' });
  assert.notEqual(second.shareId, first.shareId);
  assert.equal((await call(db, `/shares/${first.shareId}`)).status, 404);
});

test('deletion removes private content and prevents delayed upload resurrection', async (t) => {
  const db = database(t);
  await call(db, '/records/test', 'PUT', record);
  const { data: shared } = await call(db, '/records/test/share', 'POST', { nickname: '' });
  await call(db, '/records/test', 'DELETE');
  assert.equal((await call(db, '/records')).data.records.length, 0);
  assert.equal((await call(db, `/shares/${shared.shareId}`)).status, 404);
  assert.equal((await call(db, '/records/test', 'PUT', record)).status, 404);
  const row = await db.prepare('SELECT * FROM profiles WHERE id = ?').bind('test').first();
  assert.equal(row.answers_json, '{}');
  assert.equal(row.result_json, '{}');
});

test('invalid input and missing configuration fail cleanly', async (t) => {
  const db = database(t);
  assert.equal((await call(db, '/records', 'GET', undefined, '')).status, 401);
  assert.equal((await call(db, '/records/bad', 'PUT', { ...record, answers: [] })).status, 400);
  assert.equal((await call(db, '/records/bad', 'PUT', { ...record, result: {} })).status, 400);
  const broken = structuredClone(record);
  broken.result.similarities[0].profile.color = null;
  assert.equal((await call(db, '/records/bad', 'PUT', broken)).status, 400);
  const response = await handleRequest(new Request('https://blur.test/api/records'), {});
  assert.equal(response.status, 503);
  assert.ok(response.headers.get('X-Request-Id'));
});

test('comparison uses signed vector differences and checks both versions', async () => {
  const { compareDimensions } = await import('../src/utils/comparison.js');
  const opposite = Object.fromEntries(Object.entries(result.userVector).map(([key, value]) => [key, -value]));
  assert.equal(compareDimensions(result.userVector, result.userVector).at(-1).gap, 0);
  assert.ok(compareDimensions(result.userVector, opposite).at(-1).gap > 0);
  assert.ok(canCompare(record, record));
  assert.ok(!canCompare(record, { ...record, questionVersion: 'different' }));
  assert.ok(!canCompare(record, { ...record, engineVersion: 'different' }));
  assert.deepEqual(publicResult(result).userVector, result.userVector);
});

function browser(t, db) {
  const storage = new Map();
  const old = { window: globalThis.window, localStorage: globalThis.localStorage, fetch: globalThis.fetch };
  let rejectWrite;
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem(key, value) {
      if (rejectWrite?.(key, value)) { rejectWrite = null; throw new Error('storage full'); }
      storage.set(key, value);
    },
    removeItem: (key) => storage.delete(key),
  };
  globalThis.localStorage = localStorage;
  globalThis.window = { localStorage, dispatchEvent() {} };
  let online = true;
  const requests = [];
  globalThis.fetch = async (path, options) => {
    requests.push({ path, method: options.method });
    if (!online) throw new TypeError('offline');
    return handleRequest(new Request(new URL(path, 'https://blur.test'), options), { DB: db });
  };
  t.after(() => { Object.assign(globalThis, old); });
  return { storage, requests, failWrite: (predicate) => { rejectWrite = predicate; },
    offline: () => { online = false; }, online: () => { online = true; } };
}

test('saving and reconnecting never create identity or upload without explicit consent', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  connection.offline();
  const saved = saveHistoryRecord(answers, result);
  assert.equal(getIdentityToken(), null);
  await assert.rejects(publishRecord(saved, '我'), /先同步/);
  assert.equal(getHistoryRecords()[0].syncStatus, 'local');
  assert.deepEqual(getHistoryRecords()[0].result.userVector, result.userVector);
  connection.online();
  await flushPending();
  await refreshCloudHistory();
  assert.ok(connection.requests.every((request) => request.method === 'GET'));
  assert.equal((await call(db, '/records', 'GET', undefined, getIdentityToken())).data.records.length, 0);
});

test('explicit sync is private and idempotent; offline retries require another explicit action', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  connection.offline();
  await assert.rejects(syncRecord(saved));
  assert.equal(getHistoryRecords()[0].syncStatus, 'failed');
  assert.throws(() => removeLocalRecord(saved.id), /同步尚未确认/);
  const cloudId = getHistoryRecords()[0].cloudId;
  connection.online();
  await flushPending();
  assert.equal(connection.requests.filter((request) => request.method === 'PUT').length, 1);
  const first = syncRecord(saved);
  assert.equal(first, syncRecord(saved));
  await first;
  await refreshCloudHistory();
  assert.equal(getHistoryRecords().length, 1);
  assert.equal(getHistoryRecords()[0].syncStatus, 'synced');
  assert.equal(getHistoryRecords()[0].cloudId, cloudId);
  assert.notEqual(saved.id, cloudId);
  assert.equal(getHistoryRecords()[0].shareId, null);
  assert.equal(recordStatus(getHistoryRecords()[0]).storage, '本机 + 云端');
});

test('offline revocation and cloud deletion remain pending until explicitly retried', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  await publishRecord(saved, '我');
  const published = getHistoryRecords()[0];
  connection.offline();
  await assert.rejects(revokeShare(published));
  assert.equal(getHistoryRecords()[0].pendingAction, 'revoke');
  assert.equal(getHistoryRecords()[0].shareId, published.shareId);
  assert.equal(recordStatus(getHistoryRecords()[0]).sharing, '停止分享待确认');
  connection.online();
  await flushPending();
  assert.equal(getHistoryRecords()[0].shareId, null);
  connection.offline();
  await assert.rejects(removeCloudCopy(getHistoryRecords()[0]));
  assert.equal(getHistoryRecords()[0].pendingAction, 'delete-cloud');
  assert.deepEqual(getHistoryRecords()[0].answers, answers);
  connection.online();
  await flushPending();
  await refreshCloudHistory();
  assert.equal(getAllHistoryRecords().length, 1);
  assert.equal(getHistoryRecords()[0].cloudId, null);
  assert.equal(getHistoryRecords()[0].localPresent, true);
});

test('cloud deletion keeps local data; resync uses a new id and old links stay dead', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const first = await publishRecord(saved, '我');
  await removeCloudCopy(saved);
  assert.deepEqual(getHistoryRecords()[0].result, result);
  assert.equal((await call(db, `/shares/${first.shareId}`)).status, 404);
  await syncRecord(saved);
  const second = await publishRecord(saved, '我');
  assert.notEqual(first.cloudId, second.cloudId);
  assert.notEqual(first.shareId, second.shareId);
  assert.equal((await call(db, `/records/${first.cloudId}`, 'PUT', { ...record, localId: 'late-retry' }, getIdentityToken())).status, 404);
  assert.equal((await call(db, `/shares/${first.shareId}`)).status, 404);
});

test('history refresh recovers a share whose publish response was lost', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const send = globalThis.fetch;
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (options.method === 'POST' && path.endsWith('/share')) throw new TypeError('lost response');
    return response;
  };
  await assert.rejects(publishRecord(saved, '我'));
  assert.equal(recordStatus(getHistoryRecords()[0]).sharing, '开启分享待确认');
  globalThis.fetch = send;
  await refreshCloudHistory();
  const shareId = getHistoryRecords()[0].shareId;
  updateHistoryRecord(saved.id, { shareId: null });
  await refreshCloudHistory();
  assert.equal(getHistoryRecords()[0].shareId, shareId);
});

test('legacy pending uploads are visible but never automatically retried', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  connection.storage.set('blur.history.v1', JSON.stringify([{ ...record, id: 'legacy', syncStatus: 'pending' }]));
  assert.equal(getHistoryRecords()[0].syncStatus, 'failed');
  await flushPending();
  assert.equal(connection.requests.length, 0);
  assert.deepEqual(getHistoryRecords()[0].result, result);
});

test('static SPA fallback must not be mistaken for successful cloud storage', async (t) => {
  const db = database(t);
  browser(t, db);
  globalThis.fetch = async () => new Response('<html>static frontend</html>', { status: 200 });
  const saved = saveHistoryRecord(answers, result);
  await assert.rejects(syncRecord(saved), /云端暂不可用/);
  assert.equal(getHistoryRecords()[0].syncStatus, 'failed');
});

test('local deletion leaves a private cloud summary and preserves sharing', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const shared = await publishRecord(saved, '我');
  removeLocalRecord(saved.id);
  const summary = getHistoryRecords()[0];
  assert.equal(summary.localPresent, false);
  assert.equal(summary.result, undefined);
  assert.equal((await call(db, `/shares/${shared.shareId}`)).status, 200);
  const list = (await call(db, '/records?summary=1', 'GET', undefined, getIdentityToken())).data.records;
  assert.equal(list[0].result, undefined);
  assert.equal(list[0].answers, undefined);
  assert.equal(list[0].preview.title, result.archetype.title);
  assert.equal((await call(db, `/records/${summary.cloudId}`, 'GET', undefined, bob)).status, 404);
  await downloadRecord(summary);
  assert.deepEqual(getHistoryRecords()[0].result.userVector, result.userVector);
});

test('removing a cloud-only portrait downloads and saves it before remote deletion', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const cloudId = getHistoryRecords()[0].cloudId;
  removeLocalRecord(saved.id);
  connection.failWrite((key, value) => key === 'blur.history.v1' && value.includes('"localPresent":true'));
  await assert.rejects(removeCloudCopy(saved), /本机操作状态/);
  assert.equal((await call(db, `/records/${cloudId}`, 'GET', undefined, getIdentityToken())).status, 200);
  await removeCloudCopy(saved);
  assert.equal(getHistoryRecords()[0].cloudId, null);
  assert.deepEqual(getHistoryRecords()[0].answers, answers);
  assert.equal((await call(db, `/records/${cloudId}`, 'GET', undefined, getIdentityToken())).status, 404);
});

test('failed verification shows uncertainty and a remote deletion is reconciled without reuploading', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  await publishRecord(saved, '我');
  const cloudId = getHistoryRecords()[0].cloudId;
  connection.offline();
  await assert.rejects(refreshCloudHistory());
  assert.equal(recordStatus(getHistoryRecords()[0]).storage, '云端状态待核实');
  assert.equal(recordStatus(getHistoryRecords()[0]).sharing, '上次确认分享中');
  connection.online();
  await call(db, `/records/${cloudId}`, 'DELETE', undefined, getIdentityToken());
  await refreshCloudHistory();
  assert.equal(getHistoryRecords()[0].cloudId, null);
  assert.deepEqual(getHistoryRecords()[0].result, result);
  assert.equal(connection.requests.filter((request) => request.method === 'PUT').length, 1);
});

test('a stale cloud id can be explicitly synced again after deletion elsewhere', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const cloudId = getHistoryRecords()[0].cloudId;
  await call(db, `/records/${cloudId}`, 'DELETE', undefined, getIdentityToken());
  await assert.rejects(syncRecord(saved));
  assert.equal(getHistoryRecords()[0].cloudId, null);
  await syncRecord(saved);
  assert.notEqual(getHistoryRecords()[0].cloudId, cloudId);
});

test('nickname and optional recovery identity can exist without uploading any portraits', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  saveHistoryRecord(answers, result);
  await saveNickname('小林');
  assert.equal(connection.requests.length, 0);
  const key = await exportRecoveryKey();
  assert.ok(key.startsWith('BLUR-'));
  assert.equal(getAccountInfo().nickname, '小林');
  assert.equal((await call(db, '/records', 'GET', undefined, getIdentityToken())).data.records.length, 0);
  await saveNickname('新昵称');
  assert.equal((await call(db, '/account', 'GET', undefined, getIdentityToken())).data.nickname, '新昵称');
});

test('first sync persists the guest nickname but does not publish it', async (t) => {
  const db = database(t);
  browser(t, db);
  await saveNickname('小林');
  await syncRecord(saveHistoryRecord(answers, result));
  await refreshCloudHistory();
  assert.equal(getAccountInfo().nickname, '小林');
  assert.equal(getHistoryRecords()[0].shareId, null);
});

test('cross-device recovery lists summaries, keeps device-local portraits and never uploads them', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const original = saveHistoryRecord(answers, result);
  await syncRecord(original);
  await publishRecord(original, '我');
  const key = await exportRecoveryKey();
  const originalToken = getIdentityToken();
  connection.storage.clear();
  const deviceLocal = saveHistoryRecord(answers, result);
  const beforeWrites = connection.requests.filter((request) => request.method !== 'GET').length;
  await restoreIdentity(key);
  assert.equal(getIdentityToken(), originalToken);
  assert.equal(connection.requests.filter((request) => request.method !== 'GET').length, beforeWrites);
  const recovered = getHistoryRecords().find((item) => item.id === original.id);
  assert.equal(recovered.localPresent, false);
  assert.equal(recovered.result, undefined);
  assert.equal(recovered.cloudSession, CLOUD_SESSION);
  assert.equal(getHistoryRecords().find((item) => item.id === deviceLocal.id).cloudId, null);
  await downloadRecord(recovered);
  assert.deepEqual(getHistoryRecords().find((item) => item.id === original.id).answers, answers);
});

test('invalid, unknown and offline recovery leave the current identity and records untouched', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  await saveNickname('本机用户');
  saveHistoryRecord(answers, result);
  const before = [...connection.storage];
  await assert.rejects(restoreIdentity('broken'), /格式/);
  await assert.rejects(restoreIdentity(formatRecoveryKey(bob)), /没有云端存档/);
  connection.offline();
  await assert.rejects(restoreIdentity(formatRecoveryKey(alice)));
  assert.deepEqual([...connection.storage], before);
});

test('storage failure during identity switching rolls back both identity and local history', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  await call(db, '/records/existing', 'PUT', record);
  await saveNickname('原身份');
  saveHistoryRecord(answers, result);
  const before = new Map(connection.storage);
  connection.failWrite((key) => key === 'blur.account.v1');
  await assert.rejects(restoreIdentity(formatRecoveryKey(alice)), /storage full/);
  assert.deepEqual(new Map(connection.storage), before);
});

test('pending mutations block identity switching and stale refresh cannot undo a newer deletion', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  await syncRecord(saved);
  const send = globalThis.fetch;
  let release;
  let reached;
  const held = new Promise((resolve) => { reached = resolve; });
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (path.includes('?summary')) {
      reached();
      await new Promise((resolve) => { release = resolve; });
    }
    return response;
  };
  const refresh = refreshCloudHistory();
  await held;
  await removeCloudCopy(saved);
  release();
  await refresh;
  assert.equal(getHistoryRecords()[0].cloudId, null);
  connection.offline();
  await syncRecord(saved).catch(() => {});
  updateHistoryRecord(saved.id, { pendingAction: 'revoke' });
  await assert.rejects(restoreIdentity(formatRecoveryKey(bob)), /待确认/);
});

test('additive migration preserves legacy portraits, share links and anonymous ownership', async (t) => {
  const db = database(t, true);
  const owner = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(alice));
  const ownerHash = Buffer.from(owner).toString('hex');
  const shareId = 'c'.repeat(32);
  db.sqlite.prepare(`INSERT INTO profiles (id, owner_hash, created_at, engine_version, question_version,
    answer_count, answers_json, result_json, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('legacy', ownerHash, record.createdAt, ENGINE_VERSION, QUESTION_VERSION, 10, JSON.stringify(answers), JSON.stringify(result), shareId);
  db.sqlite.exec(readFileSync(new URL('../migrations/0002_accounts.sql', import.meta.url), 'utf8'));
  db.sqlite.exec(readFileSync(new URL('../migrations/0003_people.sql', import.meta.url), 'utf8'));
  db.sqlite.exec(readFileSync(new URL('../migrations/0004_privacy.sql', import.meta.url), 'utf8'));
  db.sqlite.exec(readFileSync(new URL('../migrations/0005_result_permissions.sql', import.meta.url), 'utf8'));
  assert.equal((await call(db, '/account')).data.id, await identityId(alice));
  assert.equal((await call(db, '/records?summary=1')).data.records[0].id, 'legacy');
  assert.equal((await call(db, `/shares/${shareId}`)).status, 200);
  assert.equal((await call(db, '/records/legacy')).data.cloudId, 'legacy');
  db.sqlite.prepare('UPDATE profiles SET local_id = NULL WHERE id = ?').run('legacy');
  assert.equal((await call(db, '/records/legacy', 'PUT', record)).status, 200);
});

test('duplicate cloud uploads of one local portrait collapse to one active snapshot', async (t) => {
  const db = database(t);
  const first = await call(db, '/records/cloud-a', 'PUT', { ...record, localId: 'local-a' });
  const retry = await call(db, '/records/cloud-b', 'PUT', { ...record, localId: 'local-a' });
  assert.equal(first.data.cloudId, retry.data.cloudId);
  assert.equal((await call(db, '/records')).data.records.length, 1);
  await call(db, '/records/cloud-a', 'DELETE');
  assert.equal((await call(db, '/records/cloud-b', 'PUT', { ...record, localId: 'local-a' })).status, 200);
});

async function pair(db) {
  const a = (await call(db, '/account', 'POST', { nickname: '小林', bio: '喜欢和朋友待着。' })).data;
  const b = (await call(db, '/account', 'POST', { nickname: '小满', bio: '想出去走走。' }, bob)).data;
  return { a, b };
}

test('explicit identity creation is idempotent, separate from credentials, and uploads no portraits', async (t) => {
  const db = database(t);
  const { a } = await pair(db);
  const again = await call(db, '/account', 'POST', { nickname: '新名字', bio: '新的介绍' });
  assert.match(a.publicId, /^[a-f0-9]{32}$/);
  assert.match(a.friendCode, /^[A-F0-9]{12}$/);
  assert.notEqual(a.friendCode.toLowerCase(), a.id);
  assert.equal(again.data.publicId, a.publicId);
  assert.equal(again.data.friendCode, a.friendCode);
  assert.equal(again.data.bio, '新的介绍');
  assert.equal(again.data.friendsVisible, false);
  assert.equal((await call(db, '/records')).data.records.length, 0);
  assert.equal((await call(db, '/account', 'POST', { nickname: 'x', bio: 'x'.repeat(81) })).status, 400);
  assert.equal((await call(db, '/account', 'POST', [])).status, 400);
});

test('friend-code lookup returns only invitation information; self and unknown codes are rejected', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  const found = await call(db, `/people/by-code/${b.friendCode}`);
  assert.deepEqual(Object.keys(found.data).sort(), ['bio', 'nickname', 'publicId', 'requireFriendApproval']);
  assert.equal(found.data.publicId, b.publicId);
  assert.equal((await call(db, '/people/by-code/000000000000')).status, 404);
  assert.equal((await call(db, '/friends', 'POST', { publicId: a.publicId })).status, 400);
  assert.equal((await call(db, '/friends', 'POST', { publicId: 'bad' })).status, 400);
});

test('legacy clients without code proof keep manual confirmation and cannot bypass it using public IDs', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  const first = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  const again = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  const crossed = (await call(db, '/friends', 'POST', { publicId: a.publicId }, bob)).data;
  assert.equal(first.id, again.id);
  assert.equal(first.id, crossed.id);
  assert.equal(crossed.direction, 'incoming');
  assert.equal(crossed.status, 'pending');
  assert.equal((await call(db, `/friends/${first.id}/accept`, 'POST')).status, 403);
  await call(db, '/account', 'POST', { nickname: '旁人' }, 'd'.repeat(64));
  assert.equal((await call(db, `/friends/${first.id}/accept`, 'POST', undefined, 'd'.repeat(64))).status, 404);
  assert.equal((await call(db, `/friends/${first.id}/accept`, 'POST', undefined, bob)).status, 200);
  assert.equal((await call(db, `/friends/${first.id}/accept`, 'POST', undefined, bob)).status, 200);
  const list = (await call(db, '/friends')).data.connections;
  assert.equal(list.length, 1);
  assert.equal(list[0].status, 'accepted');
  assert.equal(list[0].person.nickname, '小满');
  assert.equal(JSON.stringify(list).includes('owner_hash'), false);
});

test('current friend codes connect immediately by default, with idempotent repeated and crossed adds', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  assert.equal(a.requireFriendApproval, false);
  assert.equal(b.requireFriendApproval, false);
  const first = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  assert.equal(first.status, 'accepted');
  const again = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  const crossed = (await call(db, '/friends', 'POST', { publicId: a.publicId, friendCode: a.friendCode }, bob)).data;
  assert.equal(first.id, again.id);
  assert.equal(first.id, crossed.id);
  assert.equal(crossed.status, 'accepted');
  const list = (await call(db, '/friends')).data.connections;
  assert.equal(list.length, 1);
  assert.ok(list[0].acceptedAt);
  assert.equal((await call(db, `/friends/${b.publicId}/profile`)).status, 200);
  assert.equal((await call(db, `/friends/${b.publicId}/profile`)).data.portrait, null);
});

test('approval preference is enforced at add time and affects future adds without rewriting existing pairs', async (t) => {
  const db = database(t);
  const { b } = await pair(db);
  assert.equal((await call(db, `/people/by-code/${b.friendCode}`)).data.requireFriendApproval, false);
  assert.equal((await call(db, '/account/privacy', 'PUT', { requireFriendApproval: true }, bob)).data.requireFriendApproval, true);
  const added = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  assert.equal(added.status, 'pending');
  assert.equal((await call(db, `/friends/${b.publicId}/profile`)).status, 403);
  assert.equal((await call(db, `/friends/${added.id}/accept`, 'POST')).status, 403);
  await call(db, '/account/privacy', 'PUT', { requireFriendApproval: false }, bob);
  assert.equal((await call(db, '/friends')).data.connections[0].status, 'pending');
  const retried = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  assert.equal(retried.id, added.id);
  assert.equal(retried.status, 'accepted');
  await call(db, '/account/privacy', 'PUT', { requireFriendApproval: true }, bob);
  assert.equal((await call(db, '/friends')).data.connections[0].status, 'accepted');
  for (const value of [null, 0, 'false']) assert.equal((await call(db, '/account/privacy', 'PUT', { requireFriendApproval: value })).status, 400);
  assert.equal((await call(db, '/account')).data.requireFriendApproval, false);
});

test('rotating friend codes invalidates lookup and stale adds while preserving friends, portraits and shares', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  await call(db, '/records/portrait', 'PUT', record, bob);
  await call(db, '/account/portrait', 'PUT', { portraitId: 'portrait', friendsVisible: true }, bob);
  const share = (await call(db, '/records/portrait/share', 'POST', { nickname: '小满' }, bob)).data.shareId;
  const connected = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  const rotated = (await call(db, '/account/friend-code', 'POST', undefined, bob)).data;
  assert.notEqual(rotated.friendCode, b.friendCode);
  assert.equal(rotated.publicId, b.publicId);
  assert.equal(rotated.portraitId, 'portrait');
  assert.equal(rotated.friendsVisible, true);
  assert.equal((await call(db, `/people/by-code/${b.friendCode}`)).status, 404);
  assert.equal((await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).status, 404);
  assert.equal((await call(db, `/friends/${b.publicId}/profile`)).data.portrait.id, 'portrait');
  assert.equal((await call(db, `/shares/${share}`)).status, 200);
  await call(db, `/friends/${connected.id}`, 'DELETE');
  const thirdToken = 'c'.repeat(64);
  await call(db, '/account', 'POST', { nickname: '新朋友' }, thirdToken);
  assert.equal((await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode }, thirdToken)).status, 404);
  assert.equal((await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: rotated.friendCode }, thirdToken)).data.status, 'accepted');
  assert.equal((await call(db, '/friends', 'POST', { publicId: a.publicId, friendCode: rotated.friendCode }, thirdToken)).status, 404);
  assert.equal((await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: null })).status, 400);
});

test('privacy migration preserves accepted and pending relationships and all existing account data', async (t) => {
  const db = database(t);
  const { b } = await pair(db);
  await call(db, '/records/preserved', 'PUT', record);
  await call(db, '/account/portrait', 'PUT', { portraitId: 'preserved', friendsVisible: true });
  const share = (await call(db, '/records/preserved/share', 'POST', { nickname: '小林' })).data.shareId;
  const relation = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  const third = (await call(db, '/account', 'POST', { nickname: '另一位朋友' }, 'c'.repeat(64))).data;
  const accepted = (await call(db, '/friends', 'POST', { publicId: third.publicId, friendCode: third.friendCode })).data;
  // Recreate the old schema before adding the new preference.
  db.sqlite.exec('ALTER TABLE accounts DROP COLUMN require_friend_approval');
  const before = db.sqlite.prepare('SELECT * FROM accounts ORDER BY owner_hash').all();
  db.sqlite.exec(readFileSync(new URL('../migrations/0004_privacy.sql', import.meta.url), 'utf8'));
  const after = db.sqlite.prepare('SELECT * FROM accounts ORDER BY owner_hash').all();
  after.forEach((row, i) => { assert.equal(row.require_friend_approval, 0); delete row.require_friend_approval; assert.deepEqual(row, before[i]); });
  const connections = (await call(db, '/friends')).data.connections;
  assert.equal(connections.find((c) => c.id === relation.id).status, 'pending');
  assert.equal(connections.find((c) => c.id === accepted.id).status, 'accepted');
  assert.equal((await call(db, '/account')).data.portraitId, 'preserved');
  assert.equal((await call(db, '/account')).data.friendsVisible, true);
  assert.equal((await call(db, '/records/preserved')).status, 200);
  assert.equal((await call(db, `/shares/${share}`)).status, 200);
});

test('client privacy updates persist across refresh and recovery without uploading local records', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const local = saveHistoryRecord(answers, result);
  await saveProfile({ nickname: '隐私测试' }, true);
  await savePrivacy(true);
  const oldCode = getAccountInfo().friendCode;
  await resetFriendCode();
  assert.notEqual(getAccountInfo().friendCode, oldCode);
  const key = await exportRecoveryKey();
  await refreshCloudHistory();
  await restoreIdentity(key);
  assert.equal(getAccountInfo().requireFriendApproval, true);
  assert.equal((await readPeople('/records')).records.length, 0);
  assert.equal(connection.requests.some((r) => r.path.startsWith('/api/records/') && r.method === 'PUT'), false);
  await selectPortrait(local, true);
  await saveResultVisibility('private');
  assert.equal(getAccountInfo().friendsVisible, false);
  assert.ok(getAccountInfo().portraitId);
  connection.offline();
  await assert.rejects(savePrivacy(false));
  assert.equal(getAccountInfo().requireFriendApproval, true);
});

test('result permissions default to friends before a portrait exists and portrait choice follows the permission', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  assert.equal(a.resultVisibility, 'friends');
  await call(db, '/records/visible', 'PUT', record);
  const selected = await call(db, '/account/portrait', 'PUT', { portraitId: 'visible' });
  assert.equal(selected.data.friendsVisible, true);
  const connection = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  assert.equal(connection.status, 'accepted');
  const shown = await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob);
  assert.equal(shown.data.portrait.id, 'visible');
  assert.equal(shown.data.portrait.answers, undefined);
  await call(db, '/account/privacy', 'PUT', { resultVisibility: 'private' });
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait, null);
  await call(db, '/records/other', 'PUT', record);
  assert.equal((await call(db, '/account/portrait', 'PUT', { portraitId: 'other' })).data.resultVisibility, 'private');
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait, null);
  await call(db, '/account/privacy', 'PUT', { resultVisibility: 'friends' });
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait.id, 'other');
  for (const value of ['public', '', null, true]) assert.equal((await call(db, '/account/privacy', 'PUT', { resultVisibility: value })).status, 400);
  assert.equal((await call(db, '/account')).data.resultVisibility, 'friends');
});

test('default friend visibility syncs the displayed result once and never falls back after deletion', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const first = saveHistoryRecord(answers, result);
  updateAccountInfo({ displayRecordId: first.id });
  await syncDefaultPortrait();
  assert.equal(connection.requests.length, 0);
  await saveProfile({ nickname: '默认好友可见' }, true);
  await syncDefaultPortrait();
  assert.equal(getAccountInfo().friendsVisible, true);
  assert.equal(getHistoryRecords()[0].shareId, null);
  const portraitId = getAccountInfo().portraitId;
  saveHistoryRecord(answers, result);
  await syncDefaultPortrait();
  assert.equal((await readPeople('/records')).records.length, 1);
  assert.equal(getAccountInfo().portraitId, portraitId);
  await removeCloudCopy(getHistoryRecords().find((r) => r.id === first.id));
  await refreshCloudHistory();
  assert.equal(getAccountInfo().hasPortraitSelection, true);
  await syncDefaultPortrait();
  assert.equal((await readPeople('/records')).records.length, 0);
});

test('private preference survives identity creation, stays private when choosing a result and can later become friends-visible', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const local = saveHistoryRecord(answers, result);
  updateAccountInfo({ displayRecordId: local.id });
  await saveResultVisibility('private');
  await saveProfile({ nickname: '自己的结果' }, true);
  assert.equal(getAccountInfo().resultVisibility, 'private');
  await syncDefaultPortrait();
  assert.equal(connection.requests.some((r) => r.path.startsWith('/api/records/') && r.method === 'PUT'), false);
  await saveResultVisibility('friends');
  assert.equal(getAccountInfo().friendsVisible, true);
  await saveResultVisibility('private');
  await selectPortrait(getHistoryRecords()[0]);
  assert.equal(getAccountInfo().resultVisibility, 'private');
  assert.equal(getAccountInfo().friendsVisible, false);
  const key = await exportRecoveryKey();
  connection.storage.clear();
  await restoreIdentity(key);
  assert.equal(getAccountInfo().resultVisibility, 'private');
  await assert.rejects(saveResultVisibility('public'), /暂未开放/);
});

test('default visibility never uploads another identity’s local results after recovery', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const local = saveHistoryRecord(answers, result);
  updateAccountInfo({ displayRecordId: local.id });
  await saveProfile({ nickname: '本机原身份' }, true);
  await call(db, '/account', 'POST', { nickname: '恢复的空身份' }, bob);
  await restoreIdentity(formatRecoveryKey(bob));
  await syncDefaultPortrait();
  assert.equal(getAccountInfo().displayRecordId, undefined);
  assert.equal((await readPeople('/records')).records.length, 0);
  assert.equal(connection.requests.some((r) => r.path.startsWith('/api/records/') && r.method === 'PUT'), false);
  assert.ok(getHistoryRecords().some((r) => r.id === local.id && r.localPresent));
});

test('result permission migration preserves explicit privacy, displayed snapshots, links and relationships', async (t) => {
  const db = database(t);
  const { b } = await pair(db);
  await call(db, '/records/private-old', 'PUT', record);
  await call(db, '/account/portrait', 'PUT', { portraitId: 'private-old', friendsVisible: false });
  const shareId = (await call(db, '/records/private-old/share', 'POST', { nickname: '旧分享' })).data.shareId;
  const relation = (await call(db, '/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).data;
  db.sqlite.exec('DROP TRIGGER accounts_legacy_result_visibility');
  db.sqlite.exec('ALTER TABLE accounts DROP COLUMN result_visibility');
  db.sqlite.exec(readFileSync(new URL('../migrations/0005_result_permissions.sql', import.meta.url), 'utf8'));
  assert.equal((await call(db, '/account')).data.resultVisibility, 'private');
  assert.equal((await call(db, '/account', 'GET', undefined, bob)).data.resultVisibility, 'friends');
  assert.equal((await call(db, '/account')).data.portraitId, 'private-old');
  assert.equal((await call(db, '/friends')).data.connections[0].id, relation.id);
  assert.equal((await call(db, `/shares/${shareId}`)).status, 200);
  assert.equal((await call(db, '/records/private-old')).status, 200);
  // An old deployed worker can still change the legacy boolean during rollout.
  db.sqlite.prepare('UPDATE accounts SET friends_visible = 1 WHERE public_id = ?').run((await call(db, '/account')).data.publicId);
  assert.equal((await call(db, '/account')).data.resultVisibility, 'friends');
  db.sqlite.prepare('UPDATE accounts SET friends_visible = 0 WHERE public_id = ?').run((await call(db, '/account')).data.publicId);
  assert.equal((await call(db, '/account')).data.resultVisibility, 'private');
});

test('only accepted friends can read the explicitly selected portrait, never raw answers or history', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  await call(db, '/records/first', 'PUT', record);
  await call(db, '/records/second', 'PUT', { ...record, createdAt: record.createdAt + 1 });
  await call(db, '/account/portrait', 'PUT', { portraitId: 'first', friendsVisible: true });
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).status, 403);
  const req = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).status, 403);
  await call(db, `/friends/${req.id}/accept`, 'POST', undefined, bob);
  const shown = (await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data;
  assert.equal(shown.portrait.id, 'first');
  assert.equal(shown.person.bio, '喜欢和朋友待着。');
  assert.equal(shown.portrait.answers, undefined);
  assert.equal(shown.portrait.shareId, undefined);
  assert.equal(shown.portrait.owner_hash, undefined);
  assert.equal(shown.records, undefined);
  assert.deepEqual(shown.portrait.result.userVector, result.userVector);
  assert.equal((await call(db, '/records/first', 'GET', undefined, bob)).status, 404);
  assert.equal((await call(db, '/account/portrait', 'PUT', { portraitId: 'first', friendsVisible: true }, bob)).status, 404);
  assert.equal((await call(db, `/friends/${b.publicId}/profile`)).data.portrait, null);
});

test('friend visibility, public links and relationship removal revoke independently', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  await call(db, '/records/portrait', 'PUT', record);
  const share = (await call(db, '/records/portrait/share', 'POST', { nickname: '小林' })).data.shareId;
  await call(db, '/account/portrait', 'PUT', { portraitId: 'portrait', friendsVisible: true });
  const req = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  await call(db, `/friends/${req.id}/accept`, 'POST', undefined, bob);
  await call(db, '/records/portrait/share', 'DELETE');
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait.id, 'portrait');
  const newShare = (await call(db, '/records/portrait/share', 'POST', { nickname: '' })).data.shareId;
  await call(db, '/account/portrait', 'PUT', { portraitId: 'portrait', friendsVisible: false });
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait, null);
  assert.equal((await call(db, `/shares/${newShare}`)).status, 200);
  await call(db, '/account/portrait', 'PUT', { portraitId: 'portrait', friendsVisible: true });
  await call(db, `/friends/${req.id}`, 'DELETE', undefined, bob);
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).status, 403);
  assert.equal((await call(db, `/shares/${newShare}`)).status, 200);
  assert.equal((await call(db, `/shares/${share}`)).status, 404);
});

test('cancelled, rejected and re-requested relationships grant no stale authorization', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  const first = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  await call(db, `/friends/${first.id}`, 'DELETE');
  assert.equal((await call(db, `/friends/${first.id}/accept`, 'POST', undefined, bob)).status, 404);
  const second = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  assert.notEqual(first.id, second.id);
  await call(db, `/friends/${second.id}`, 'DELETE', undefined, bob);
  assert.equal((await call(db, '/friends')).data.connections.length, 0);
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).status, 403);
});

test('deleting the displayed cloud portrait leaves an empty profile without fallback', async (t) => {
  const db = database(t);
  const { a, b } = await pair(db);
  await call(db, '/records/first', 'PUT', record);
  await call(db, '/records/second', 'PUT', record);
  await call(db, '/account/portrait', 'PUT', { portraitId: 'first', friendsVisible: true });
  const req = (await call(db, '/friends', 'POST', { publicId: b.publicId })).data;
  await call(db, `/friends/${req.id}/accept`, 'POST', undefined, bob);
  await call(db, '/records/first', 'DELETE');
  assert.equal((await call(db, '/account')).data.portraitId, null);
  assert.equal((await call(db, '/account')).data.friendsVisible, false);
  assert.equal((await call(db, `/friends/${a.publicId}/profile`, 'GET', undefined, bob)).data.portrait, null);
  assert.equal((await call(db, '/records')).data.records.length, 1);
});

test('profile edits, explicit portrait choice and recovery preserve privacy and cloud profile', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const local = saveHistoryRecord(answers, result);
  await saveProfile({ nickname: '小林', bio: '最近喜欢散步。' });
  assert.equal(connection.requests.length, 0);
  await selectPortrait(local, false);
  assert.equal(connection.requests.length, 0);
  assert.equal(getAccountInfo().displayRecordId, local.id);
  await saveProfile({ nickname: '小林', bio: '最近喜欢散步。' }, true);
  assert.equal((await call(db, '/records', 'GET', undefined, getIdentityToken())).data.records.length, 0);
  await selectPortrait(local, true);
  const selected = getAccountInfo().portraitId;
  assert.ok(selected);
  assert.equal(getHistoryRecords()[0].shareId, null);
  const newer = saveHistoryRecord(answers, result);
  assert.equal(displayRecord(getHistoryRecords(), getAccountInfo()).id, local.id);
  assert.notEqual(newer.id, local.id);
  const key = await exportRecoveryKey();
  connection.storage.clear();
  await restoreIdentity(key);
  assert.equal(getAccountInfo().bio, '最近喜欢散步。');
  assert.equal(getAccountInfo().portraitId, selected);
  assert.equal(getAccountInfo().friendsVisible, true);
  assert.equal(getHistoryRecords().length, 1);
  connection.offline();
  await assert.rejects(saveProfile({ nickname: '不会保存', bio: '' }));
  assert.equal(getAccountInfo().nickname, '小林');
});

test('identity switch is blocked during a profile write and late responses cannot overwrite a new identity', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const send = globalThis.fetch;
  let reached, release;
  const held = new Promise((r) => { reached = r; });
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (path === '/api/account' && options.method === 'POST') { reached(); await new Promise((r) => { release = r; }); }
    return response;
  };
  const saving = saveProfile({ nickname: '旧身份', bio: '' }, true);
  await held;
  await assert.rejects(restoreIdentity(formatRecoveryKey(bob)), /正在进行/);
  connection.storage.set('blur.identity.v1', bob);
  connection.storage.set('blur.account.v1', JSON.stringify({ id: await identityId(bob), nickname: '当前身份' }));
  release();
  await assert.rejects(saving, /身份已切换/);
  assert.equal(getAccountInfo().nickname, '当前身份');
});

test('an older account refresh cannot replace a newer profile edit', async (t) => {
  const db = database(t);
  browser(t, db);
  await saveProfile({ nickname: '旧名字', bio: '' }, true);
  const send = globalThis.fetch;
  let reached, release;
  const held = new Promise((r) => { reached = r; });
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (path === '/api/account' && options.method === 'GET') { reached(); await new Promise((r) => { release = r; }); }
    return response;
  };
  const refresh = refreshCloudHistory();
  await held;
  await saveProfile({ nickname: '新名字', bio: '新的介绍' });
  release(); await refresh;
  assert.equal(getAccountInfo().nickname, '新名字');
  assert.equal(getAccountInfo().bio, '新的介绍');
});

test('client friend operations preserve recovered connections and do not turn errors into success', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const { b } = await pair(db);
  await saveProfile({ nickname: '本机用户', bio: '' }, true);
  await friendAction('/friends', 'POST', { publicId: b.publicId });
  assert.equal((await readPeople('/friends')).connections.length, 1);
  const key = await exportRecoveryKey();
  connection.storage.clear();
  await restoreIdentity(key);
  assert.equal((await readPeople('/friends')).connections.length, 1);
  connection.offline();
  await assert.rejects(friendAction('/friends', 'POST', { publicId: b.publicId }));
});

test('comparison prompts reflect real dimensions and avoid inventing differences for identical portraits', () => {
  const identical = compareDimensions(result.userVector, result.userVector);
  assert.equal(comparisonPrompts(identical).length, 1);
  const opposite = Object.fromEntries(Object.entries(result.userVector).map(([key, value]) => [key, -value]));
  for (const item of comparisonPrompts(compareDimensions(result.userVector, opposite))) {
    assert.ok(item.scene && item.question);
    assert.ok(item.dimension.name);
  }
});

test('queued friend mutations stay bound to the identity that initiated them', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const { b } = await pair(db);
  const thirdToken = 'd'.repeat(64);
  const third = (await call(db, '/account', 'POST', { nickname: '第三位' }, thirdToken)).data;
  await saveProfile({ nickname: '原身份', bio: '' }, true);
  const originalToken = getIdentityToken();
  const send = globalThis.fetch;
  let reached, release;
  const held = new Promise((r) => { reached = r; });
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (path === '/api/friends' && options.method === 'POST') { reached(); await new Promise((r) => { release = r; }); }
    return response;
  };
  const first = friendAction('/friends', 'POST', { publicId: b.publicId });
  await held;
  const queued = friendAction('/friends', 'POST', { publicId: third.publicId });
  connection.storage.set('blur.identity.v1', bob);
  connection.storage.set('blur.account.v1', JSON.stringify({ id: await identityId(bob), registered: true }));
  release();
  await assert.rejects(first, /身份已切换/);
  await assert.rejects(queued, /身份已切换/);
  assert.equal((await call(db, '/friends', 'GET', undefined, originalToken)).data.connections.length, 1);
  assert.equal((await call(db, '/friends', 'GET', undefined, thirdToken)).data.connections.length, 0);
});

test('initializing a local identity keeps its portrait choice and a deleted explicit choice stays empty', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result);
  updateAccountInfo({ displayRecordId: saved.id });
  await ensureLocalIdentity();
  assert.equal(getAccountInfo().displayRecordId, saved.id);
  const newer = saveHistoryRecord(answers, result);
  assert.equal(displayRecord([newer, saved], getAccountInfo()).id, saved.id);
  removeLocalRecord(saved.id);
  assert.equal(displayRecord(getHistoryRecords(), getAccountInfo()), null);
});

test('accounts created by an old worker after migration acquire stable public identifiers without losing metadata', async (t) => {
  const db = database(t);
  const owner = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(alice))).toString('hex');
  db.sqlite.prepare('INSERT INTO accounts(owner_hash, nickname, created_at) VALUES (?, ?, ?)').run(owner, '旧账户', 123456);
  const first = (await call(db, '/account')).data;
  const again = (await call(db, '/account')).data;
  assert.match(first.publicId, /^[a-f0-9]{32}$/);
  assert.match(first.friendCode, /^[A-F0-9]{12}$/);
  assert.equal(first.publicId, again.publicId);
  assert.equal(first.nickname, '旧账户');
  assert.equal(first.createdAt, 123456);
});

test('anonymous counters aggregate by day and store no identity', async (t) => {
  const db = database(t);
  for (let index = 0; index < 3; index += 1) {
    const response = await call(db, '/metrics/event', 'POST', { event: 'test_completed' }, '');
    assert.equal(response.status, 200);
    assert.equal(response.data.recorded, true);
  }
  await call(db, '/metrics/event', 'POST', { event: 'test_started' }, '');
  // The endpoint is public but accepts only the two known counters.
  assert.equal((await call(db, '/metrics/event', 'POST', { event: 'answer_submitted' }, '')).status, 400);
  assert.equal((await call(db, '/metrics/event', 'POST', {}, '')).status, 400);
  assert.equal((await call(db, '/metrics/event', 'GET', undefined, '')).status, 405);
  const rows = db.sqlite.prepare('SELECT day, metric, count FROM metrics_daily ORDER BY metric').all();
  assert.deepEqual(rows.map((row) => [row.metric, row.count]), [['test_completed', 3], ['test_started', 1]]);
  assert.match(rows[0].day, /^\d{4}-\d{2}-\d{2}$/);
  // The table has no column that could identify a person.
  assert.deepEqual(db.sqlite.prepare('PRAGMA table_info(metrics_daily)').all().map((column) => column.name),
    ['day', 'metric', 'count']);
});

test('admin stats stay closed without an issued token and expose aggregates only', async (t) => {
  const db = database(t);
  await call(db, '/records/test', 'PUT', record);
  await call(db, '/records/test/share', 'POST', { nickname: '小林' });
  await call(db, '/metrics/event', 'POST', { event: 'test_completed' }, '');

  const adminToken = 'k'.repeat(32);
  // Nothing opens before a token is issued, not even a valid user identity.
  assert.equal((await call(db, '/admin/stats')).status, 503);
  assert.equal((await call(db, '/admin/stats', 'GET', undefined, adminToken)).status, 503);
  db.sqlite.prepare('INSERT INTO admin_tokens (token_hash, label, created_at) VALUES (?, ?, ?)')
    .run(createHash('sha256').update(adminToken).digest('hex'), 'test', Date.now());
  assert.equal((await call(db, '/admin/stats')).status, 401);
  assert.equal((await call(db, '/admin/stats', 'GET', undefined, 'k'.repeat(31))).status, 401);
  assert.equal((await call(db, '/admin/stats', 'GET', undefined, 'k'.repeat(33))).status, 401);

  const ok = await call(db, '/admin/stats', 'GET', undefined, adminToken);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.rangeDays, 30);
  assert.equal(ok.data.daily.length, 30);
  assert.equal(ok.data.cloud.accounts, 1);
  assert.equal(ok.data.cloud.profiles, 1);
  assert.equal(ok.data.cloud.liveShares, 1);
  assert.equal(ok.data.events.test_completed, 1);
  const text = JSON.stringify(ok.data);
  for (const secret of ['answers', 'owner_hash', 'ownerHash', 'shareId', 'nickname', '小林', record.result.archetype.title]) {
    assert.ok(!text.includes(secret));
  }
  assert.equal((await call(db, '/admin/stats?days=999', 'GET', undefined, adminToken)).data.rangeDays, 90);
  assert.equal((await call(db, '/admin/stats?days=0', 'GET', undefined, adminToken)).data.rangeDays, 1);
});

test('activity tracking degrades safely when 0006 is not yet applied', async (t) => {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_profiles.sql', '0002_accounts.sql', '0003_people.sql', '0004_privacy.sql', '0005_result_permissions.sql']) {
    sqlite.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  t.after(() => sqlite.close());
  const db = adapter(sqlite);
  // Code deployed ahead of its migration must still read and write identity data.
  assert.equal((await call(db, '/records/test', 'PUT', record)).status, 200);
  assert.equal((await call(db, '/account')).status, 200);
  assert.equal((await call(db, '/records', 'GET')).data.records.length, 1);
});
