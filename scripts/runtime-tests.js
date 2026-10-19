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
const otherToken = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const otherId = crypto.randomUUID();
let relationshipId;
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

const myAccount = (await api('/account', 'POST', { nickname: '本地联调甲', bio: '喜欢散步。' })).data;
const otherAccount = (await api('/account', 'POST', { nickname: '本地联调乙', bio: '想出去走走。' }, otherToken)).data;
assert.equal((await api(`/people/by-code/${otherAccount.friendCode}`)).data.publicId, otherAccount.publicId);
assert.equal((await api('/account/portrait', 'PUT', { portraitId: id, friendsVisible: true })).status, 200);
const otherRecord = await api(`/records/${otherId}`, 'PUT', {
  answers, result, createdAt: Date.now(), engineVersion: ENGINE_VERSION, questionVersion: QUESTION_VERSION,
}, otherToken);
assert.equal(otherRecord.status, 200);
assert.equal((await api('/account/portrait', 'PUT', { portraitId: otherId }, otherToken)).data.friendsVisible, true);
assert.equal(otherAccount.requireFriendApproval, false);
assert.equal((await api(`/friends/${myAccount.publicId}/profile`, 'GET', undefined, otherToken)).status, 403);
const direct = (await api('/friends', 'POST', { publicId: otherAccount.publicId, friendCode: otherAccount.friendCode })).data;
relationshipId = direct.id;
assert.equal(direct.status, 'accepted');
assert.equal((await api(`/friends/${myAccount.publicId}/profile`, 'GET', undefined, otherToken)).status, 200);
await api(`/friends/${relationshipId}`, 'DELETE');
assert.equal((await api('/account/privacy', 'PUT', { requireFriendApproval: true }, otherToken)).data.requireFriendApproval, true);
const pendingFriend = (await api('/friends', 'POST', { publicId: otherAccount.publicId, friendCode: otherAccount.friendCode })).data;
relationshipId = pendingFriend.id;
assert.equal(pendingFriend.status, 'pending');
assert.equal((await api(`/friends/${myAccount.publicId}/profile`, 'GET', undefined, otherToken)).status, 403);
assert.equal((await api(`/friends/${relationshipId}/accept`, 'POST', undefined, otherToken)).status, 200);
const friendPortrait = (await api(`/friends/${otherAccount.publicId}/profile`)).data.portrait;
assert.equal(friendPortrait.id, otherId);
assert.equal(friendPortrait.answers, undefined);
assert.equal(friendPortrait.shareId, undefined);
assert.equal((await api('/friends')).data.connections.length, 1);
assert.equal((await api('/account/privacy', 'PUT', { resultVisibility: 'private' }, otherToken)).data.resultVisibility, 'private');
assert.equal((await api(`/friends/${otherAccount.publicId}/profile`)).data.portrait, null);
assert.equal((await api('/account/privacy', 'PUT', { resultVisibility: 'friends' }, otherToken)).data.resultVisibility, 'friends');
assert.equal((await api('/account/privacy', 'PUT', { resultVisibility: 'public' }, otherToken)).status, 400);
console.log('✓ two real local identities: invitation, acceptance, private portrait projection and visibility revocation');
const newCode = (await api('/account/friend-code', 'POST', undefined, otherToken)).data.friendCode;
assert.equal((await api(`/people/by-code/${otherAccount.friendCode}`)).status, 404);
assert.equal((await api('/friends', 'POST', { publicId: otherAccount.publicId, friendCode: otherAccount.friendCode })).status, 404);
assert.equal((await api(`/people/by-code/${newCode}`)).data.publicId, otherAccount.publicId);

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
  for (const text of ['我的画像', '设置', '现在，我用这份画像介绍自己', '新记录会留下来', '过去的记录', '好友']) assert.ok(myPage.includes(text), text);
  const settings = renderToStaticMarkup(React.createElement(My, { tab: 'settings', records: [], account: myAccount }));
  for (const text of ['权限管理', '测试结果', '仅我可见', '好友可见', '公开可见', '暂未开放', '身份与备份', '记录与存储', '添加好友需要我确认', '已有分享链接', '保存恢复密钥']) assert.ok(settings.includes(text), text);
  assert.match(settings, /role="radio" aria-checked="true"[^>]*>.*?好友可见/);
  assert.match(settings, /role="radio" aria-checked="false" disabled=""[^>]*>.*?公开可见/);
  assert.ok(settings.includes('aria-checked="false"'));
  const history = renderToStaticMarkup(React.createElement(My, {
    tab: 'history', records: [{ ...created.data, localPresent: true }], account: myAccount,
  }));
  for (const text of ['过去的记录', '管理', '权限管理']) assert.ok(history.includes(text), text);
  const { default: Identity } = await vite.ssrLoadModule('/src/pages/Identity.jsx');
  const { default: Invite } = await vite.ssrLoadModule('/src/pages/Invite.jsx');
  const { default: FriendProfile } = await vite.ssrLoadModule('/src/pages/FriendProfile.jsx');
  const identity = renderToStaticMarkup(React.createElement(Identity, { account: {} }));
  assert.ok(identity.includes('无需邮箱') && identity.includes('创建我的身份'));
  const invite = renderToStaticMarkup(React.createElement(Invite, { account: {}, code: otherAccount.friendCode }));
  assert.ok(invite.includes('创建或恢复身份'));
  const guestFriend = renderToStaticMarkup(React.createElement(FriendProfile, { account: {}, publicId: otherAccount.publicId }));
  assert.ok(guestFriend.includes('先找回你自己的名字'));
  const friendsComparison = renderToStaticMarkup(React.createElement(Comparison, { mine: created.data, theirs: friendPortrait, friendView: true }));
  assert.ok(friendsComparison.includes('具体作答保持私密'));
  assert.ok(friendsComparison.includes('相近的侧面'));
  assert.ok(!friendsComparison.includes('共同作答'));
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
assert.equal((await api(`/friends/${myAccount.publicId}/profile`, 'GET', undefined, otherToken)).status, 200);
await api(`/friends/${relationshipId}`, 'DELETE');
assert.equal((await api(`/friends/${otherAccount.publicId}/profile`)).status, 403);
await api(`/records/${id}`, 'DELETE');
assert.equal((await api('/records')).data.records.length, 0);
console.log('✓ real Cloudflare runtime: revocation and deletion');
} finally {
  if (relationshipId) await api(`/friends/${relationshipId}`, 'DELETE').catch(() => {});
  await api(`/records/${id}`, 'DELETE').catch(() => {});
  await api(`/records/${otherId}`, 'DELETE', undefined, otherToken).catch(() => {});
}
