import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleRequest } from '../server/api.js';
import { generateResult } from '../src/utils/blurEngine.js';
import { questions } from '../src/data/questions.js';
import { publicResult, ENGINE_VERSION, QUESTION_VERSION, canCompare } from '../shared/profile.js';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord, updateHistoryRecord } from '../src/utils/historyStorage.js';
import { syncRecord, publishRecord, revokeShare, removeRecord, flushPending, refreshCloudHistory } from '../src/utils/cloud.js';

// Execute production SQL against real SQLite through the small D1 statement API.
function database(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_profiles.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
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
  const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.localStorage = localStorage;
  globalThis.window = { localStorage, dispatchEvent() {} };
  let online = true;
  globalThis.fetch = async (path, options) => {
    if (!online) throw new TypeError('offline');
    return handleRequest(new Request(new URL(path, 'https://blur.test'), options), { DB: db });
  };
  t.after(() => { Object.assign(globalThis, old); });
  return { offline: () => { online = false; }, online: () => { online = true; } };
}

test('offline save remains local and reconnect syncs exactly one snapshot', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  connection.offline();
  const saved = saveHistoryRecord(answers, result, 'pending');
  await assert.rejects(syncRecord(saved));
  assert.equal(getHistoryRecords()[0].syncStatus, 'pending');
  assert.deepEqual(getHistoryRecords()[0].result.userVector, result.userVector);
  connection.online();
  await flushPending();
  await refreshCloudHistory();
  assert.equal(getHistoryRecords().length, 1);
  assert.equal(getHistoryRecords()[0].syncStatus, 'synced');
});

test('offline revocation stays pending until confirmed; failed deletes keep tombstones', async (t) => {
  const db = database(t);
  const connection = browser(t, db);
  const saved = saveHistoryRecord(answers, result, 'pending');
  await publishRecord(saved, '我');
  const published = getHistoryRecords()[0];
  connection.offline();
  await assert.rejects(revokeShare(published));
  assert.equal(getHistoryRecords()[0].pendingAction, 'revoke');
  assert.equal(getHistoryRecords()[0].shareId, published.shareId);
  connection.online();
  await flushPending();
  assert.equal(getHistoryRecords()[0].shareId, null);
  connection.offline();
  await assert.rejects(removeRecord(getHistoryRecords()[0]));
  assert.equal(getHistoryRecords().length, 0);
  assert.equal(getAllHistoryRecords().length, 1);
  connection.online();
  await flushPending();
  await refreshCloudHistory();
  assert.equal(getAllHistoryRecords().length, 0);
});

test('concurrent retries share one in-flight upload and preserve pending deletion', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result, 'pending');
  const a = syncRecord(saved);
  const b = syncRecord(saved);
  assert.equal(a, b);
  updateHistoryRecord(saved.id, { deletedAt: Date.now(), pendingAction: 'delete' });
  await a;
  assert.equal(getHistoryRecords().length, 0);
  await flushPending();
  assert.equal(getAllHistoryRecords().length, 0);
});

test('history refresh recovers a share whose publish response was lost', async (t) => {
  const db = database(t);
  browser(t, db);
  const saved = saveHistoryRecord(answers, result, 'pending');
  await publishRecord(saved, '我');
  const shareId = getHistoryRecords()[0].shareId;
  updateHistoryRecord(saved.id, { shareId: null });
  await refreshCloudHistory();
  assert.equal(getHistoryRecords()[0].shareId, shareId);
});

test('local archive pressure keeps uploads, revocations and deletions pending', async (t) => {
  const db = database(t);
  browser(t, db);
  const pending = saveHistoryRecord(answers, result, 'pending');
  const revoking = saveHistoryRecord(answers, result, 'synced');
  updateHistoryRecord(revoking.id, { pendingAction: 'revoke' });
  const deleting = saveHistoryRecord(answers, result, 'synced');
  updateHistoryRecord(deleting.id, { deletedAt: Date.now(), pendingAction: 'delete' });
  for (let i = 0; i < 35; i++) saveHistoryRecord(answers, result);
  const all = getAllHistoryRecords();
  for (const id of [pending.id, revoking.id, deleting.id]) assert.ok(all.some((record) => record.id === id));
});

test('static SPA fallback must not be mistaken for successful cloud storage', async (t) => {
  const db = database(t);
  browser(t, db);
  globalThis.fetch = async () => new Response('<html>static frontend</html>', { status: 200 });
  const saved = saveHistoryRecord(answers, result, 'pending');
  await assert.rejects(syncRecord(saved), /云端暂不可用/);
  assert.equal(getHistoryRecords()[0].syncStatus, 'pending');
});
