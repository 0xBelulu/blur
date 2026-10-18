import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateResult } from '../src/utils/blurEngine.js';
import { questions } from '../src/data/questions.js';
import { ENGINE_VERSION, QUESTION_VERSION } from '../shared/profile.js';

const origin = process.argv[2] || 'http://127.0.0.1:18788';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname), 'Runtime tests only write disposable records to a local server');
const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const id = crypto.randomUUID();
const localId = crypto.randomUUID();
const answers = questions.slice(0, 10).map((q) => ({ questionId: q.id, type: q.type, optionId: q.options[0].id }));
const result = generateResult(answers);
async function api(path, method = 'GET', body, auth = token) {
  const response = await fetch(`${origin}/api${path}`, {
    method, headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

try {
const home = await fetch(origin);
assert.equal(home.status, 200);
assert.ok((await home.text()).includes('id="root"'));
assert.equal((await fetch(`${origin}/favicon.svg`)).status, 200);
console.log('✓ static frontend and assets are served');

const created = await api(`/records/${id}`, 'PUT', {
  localId, answers, result, createdAt: Date.now(), engineVersion: ENGINE_VERSION, questionVersion: QUESTION_VERSION,
  accountNickname: '联调身份',
});
assert.equal(created.status, 200, JSON.stringify(created.data));
assert.deepEqual(created.data.result.userVector, result.userVector);
assert.equal(created.data.id, localId);
assert.equal(created.data.cloudId, id);
assert.equal(created.data.shareId, null);
assert.equal((await api('/account')).data.nickname, '联调身份');
assert.equal((await api('/account', 'POST', { nickname: '新联调身份' })).data.nickname, '新联调身份');
const summaries = (await api('/records?summary=1')).data.records;
assert.equal(summaries[0].answers, undefined);
assert.equal(summaries[0].result, undefined);
assert.equal(summaries[0].preview.title, result.archetype.title);
assert.deepEqual((await api(`/records/${id}`)).data.answers, answers);
assert.equal((await api('/records')).data.records.length, 1);
assert.equal((await api('/records', 'GET', undefined, 'b'.repeat(64))).data.records.length, 0);
const published = await api(`/records/${id}/share`, 'POST', { nickname: '联调测试' });
assert.equal(published.status, 200);
const shared = await api(`/shares/${published.data.shareId}`, 'GET', undefined, '');
assert.equal(shared.status, 200);
assert.equal(shared.data.answers, undefined);
assert.equal(shared.data.result.rawAnswers, undefined);
console.log('✓ real Cloudflare runtime: D1 persistence, owner isolation, public projection');

const vite = await createServer({ configFile: false, plugins: [react()],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Result } = await vite.ssrLoadModule('/src/pages/Result.jsx');
  const { default: Comparison } = await vite.ssrLoadModule('/src/pages/Comparison.jsx');
  const { default: SharedProfile } = await vite.ssrLoadModule('/src/pages/SharedProfile.jsx');
  const { default: My } = await vite.ssrLoadModule('/src/pages/My.jsx');
  const { default: RecordBadges } = await vite.ssrLoadModule('/src/components/RecordBadges.jsx');
  const { CLOUD_SESSION } = await vite.ssrLoadModule('/src/utils/historyStorage.js');
  const portrait = renderToStaticMarkup(React.createElement(Result, { result: shared.data.result, publicView: true }));
  assert.ok(portrait.includes('和 ta 对比'));
  assert.ok(!portrait.includes('撤销分享'));
  const comparison = renderToStaticMarkup(React.createElement(Comparison, { mine: created.data, theirs: shared.data }));
  assert.ok(comparison.includes('十个维度，两种倾向'));
  const selector = renderToStaticMarkup(React.createElement(SharedProfile, {
    cached: shared.data, mode: 'compare', shareId: published.data.shareId, records: [created.data],
  }));
  assert.ok(selector.includes('选择哪一次的你'));
  const automatic = renderToStaticMarkup(React.createElement(SharedProfile, {
    cached: shared.data, mode: 'compare', shareId: published.data.shareId,
    records: [created.data], selectedRecordId: localId,
  }));
  assert.ok(automatic.includes('十个维度，两种倾向'));
  const myPage = renderToStaticMarkup(React.createElement(My, {
    records: [{ ...created.data, localPresent: true }, { ...summaries[0], id: 'cloud-only', localPresent: false }],
    account: { id: 'guest', nickname: '联调身份', registered: true },
  }));
  for (const text of ['我的画像', '下载到本机并查看', '同步与分享', '保存身份 / 在另一台设备恢复', '默认只保存在本机']) assert.ok(myPage.includes(text), text);
  const localBadge = renderToStaticMarkup(React.createElement(RecordBadges, { record: { localPresent: true } }));
  assert.ok(localBadge.includes('仅在本机') && localBadge.includes('未公开'));
  const cloudBadge = renderToStaticMarkup(React.createElement(RecordBadges, {
    record: { localPresent: true, cloudId: id, cloudSession: CLOUD_SESSION, shareId: 'shared' },
  }));
  assert.ok(cloudBadge.includes('本机 + 云端') && cloudBadge.includes('分享中'));
  console.log('✓ public portrait, comparison, My account/catalog and independent storage/share statuses render');
} finally { await vite.close(); }

await api(`/records/${id}/share`, 'DELETE');
assert.equal((await api(`/shares/${published.data.shareId}`)).status, 404);
await api(`/records/${id}`, 'DELETE');
assert.equal((await api('/records')).data.records.length, 0);
console.log('✓ real Cloudflare runtime: revocation and deletion');
} finally {
  await api(`/records/${id}`, 'DELETE').catch(() => {});
}
