import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleRequest } from '../server/api.js';
import { generateResult } from '../src/utils/blurEngine.js';
import { questions } from '../src/data/questions.js';
import { publicResult, ENGINE_VERSION, QUESTION_VERSION, canCompare } from '../shared/profile.js';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord, updateHistoryRecord, removeLocalRecord, CLOUD_SESSION } from '../src/utils/historyStorage.js';
import { syncRecord, publishRecord, revokeShare, removeCloudCopy, flushPending, refreshCloudHistory, downloadRecord, saveNickname, exportRecoveryKey, restoreIdentity } from '../src/utils/cloud.js';
import { getIdentityToken, getAccountInfo, formatRecoveryKey, identityId } from '../src/utils/identity.js';
import { recordStatus } from '../src/utils/recordStatus.js';

// Execute production SQL against real SQLite through the small D1 statement API.
function database(t, legacy = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_profiles.sql', import.meta.url), 'utf8'));
  if (!legacy) sqlite.exec(readFileSync(new URL('../migrations/0002_accounts.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  return { sqlite, prepare(sql) {
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
