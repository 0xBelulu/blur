// Explicit release smoke check. Creates only disposable identities and removes
// only data belonging to their freshly generated credential hashes.
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { generateResult } from '../src/utils/blurEngine.js';
import { questions } from '../src/data/questions.js';
import { ENGINE_VERSION, QUESTION_VERSION } from '../shared/profile.js';

assert.ok(process.argv.includes('--production'), 'Pass --production to check the production release');
const origin = 'https://blur-isz.pages.dev';
const tokens = [randomBytes(32).toString('hex'), randomBytes(32).toString('hex')];
const owners = tokens.map((token) => createHash('sha256').update(token).digest('hex'));
const runId = randomUUID();
const recordId = `release-${runId}`;
const cleanupFile = `.wrangler/release-${runId}.sql`;
const answers = questions.slice(0, 10).map((q) => ({ questionId: q.id, type: q.type, optionId: q.options[0].id }));
const expectedAsset = readFileSync('dist/index.html', 'utf8').match(/src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
assert.ok(expectedAsset, 'Current build must exist');

async function api(path, method = 'GET', body, token = tokens[0], expected = 200) {
  const response = await fetch(`${origin}/api${path}`, {
    method, cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, expected, `${method} ${path.replace(/\/[a-f0-9]{12,}/gi, '/:id')} status`);
  return response.json();
}

try {
  const home = await fetch(`${origin}/?release=${runId}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  assert.equal(home.status, 200);
  assert.ok((await home.text()).includes(expectedAsset), 'Production must serve the current frontend build');
  console.log('✓ Production serves the expected frontend build');

  const a = await api('/account', 'POST', { nickname: '发布验证甲', bio: '临时发布检查' });
  const b = await api('/account', 'POST', { nickname: '发布验证乙', bio: '临时发布检查' }, tokens[1]);
  assert.equal(a.resultVisibility, 'friends');
  assert.equal(b.requireFriendApproval, false);
  assert.equal((await api('/account')).publicId, a.publicId);
  await api(`/records/${recordId}`, 'PUT', {
    answers, result: generateResult(answers), createdAt: Date.now(), engineVersion: ENGINE_VERSION, questionVersion: QUESTION_VERSION,
  });
  const selected = await api('/account/portrait', 'PUT', { portraitId: recordId });
  assert.equal(selected.resultVisibility, 'friends');
  assert.equal(selected.friendsVisible, true);
  const direct = await api('/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode });
  assert.equal(direct.status, 'accepted');
  assert.equal((await api('/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode })).id, direct.id);
  let profile = await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1]);
  assert.equal(profile.portrait.id, recordId);
  assert.equal(profile.portrait.answers, undefined);
  assert.equal(profile.portrait.shareId, undefined);
  console.log('✓ Default direct friendship and friends-visible result; private answers excluded');

  await api('/account/privacy', 'PUT', { resultVisibility: 'private' });
  assert.equal((await api('/account')).resultVisibility, 'private');
  assert.equal((await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1])).portrait, null);
  await api('/account/privacy', 'PUT', { resultVisibility: 'friends' });
  assert.equal((await api('/account')).resultVisibility, 'friends');
  assert.equal((await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1])).portrait.id, recordId);
  await api('/account/privacy', 'PUT', { resultVisibility: 'public' }, tokens[0], 400);
  assert.equal((await api('/account')).resultVisibility, 'friends');
  console.log('✓ Permission write/read, immediate friend access revocation/restoration, public option unavailable');

  await api('/account/privacy', 'PUT', { requireFriendApproval: true }, tokens[1]);
  assert.equal((await api('/account', 'GET', undefined, tokens[1])).requireFriendApproval, true);
  await api(`/friends/${direct.id}`, 'DELETE');
  const pending = await api('/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode });
  assert.equal(pending.status, 'pending');
  await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1], 403);
  await api(`/friends/${pending.id}/accept`, 'POST', undefined, tokens[1]);
  const rotated = await api('/account/friend-code', 'POST', undefined, tokens[1]);
  assert.notEqual(rotated.friendCode, b.friendCode);
  await api(`/people/by-code/${b.friendCode}`, 'GET', undefined, tokens[0], 404);
  await api('/friends', 'POST', { publicId: b.publicId, friendCode: b.friendCode }, tokens[0], 404);
  assert.equal((await api(`/people/by-code/${rotated.friendCode}`)).publicId, b.publicId);
  assert.equal((await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1])).portrait.id, recordId);
  console.log('✓ Opt-in friend confirmation, code rotation, stale invitation invalidation, existing friendship preserved');

  const shared = await api(`/records/${recordId}/share`, 'POST', { nickname: '发布验证' });
  profile = await api(`/shares/${shared.shareId}`);
  assert.equal(profile.answers, undefined);
  await api(`/records/${recordId}/share`, 'DELETE');
  await api(`/shares/${shared.shareId}`, 'GET', undefined, tokens[0], 404);
  assert.equal((await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1])).portrait.id, recordId);
  await api(`/records/${recordId}`, 'DELETE');
  assert.equal((await api(`/friends/${a.publicId}/profile`, 'GET', undefined, tokens[1])).portrait, null);
  console.log('✓ Share compatibility, independent revocation and displayed-result deletion');
} finally {
  assert.ok(owners.every((owner) => /^[a-f0-9]{64}$/.test(owner)));
  const owned = owners.map((owner) => `'${owner}'`).join(',');
  mkdirSync('.wrangler', { recursive: true });
  writeFileSync(cleanupFile, `DELETE FROM friendships WHERE owner_a IN (${owned}) OR owner_b IN (${owned});\nDELETE FROM profiles WHERE owner_hash IN (${owned});\nDELETE FROM accounts WHERE owner_hash IN (${owned});\nSELECT COUNT(*) AS remaining_test_accounts FROM accounts WHERE owner_hash IN (${owned});\n`);
  const cleanup = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'blur', '--remote', '--file', cleanupFile, '--json'], {
    encoding: 'utf8', env: { ...process.env, WRANGLER_LOG_PATH: '.wrangler/logs', WRANGLER_SEND_METRICS: 'false' }, timeout: 60000,
  });
  if (cleanup.status !== 0) throw new Error(`Temporary identity cleanup failed; retry the scoped SQL at ${cleanupFile}`);
  // Remote --file imports return a batch summary, not SELECT result rows.
  // Query the scoped counts separately to verify cleanup, including tombstones.
  const verificationSql = `SELECT (SELECT COUNT(*) FROM accounts WHERE owner_hash IN (${owned})) + (SELECT COUNT(*) FROM profiles WHERE owner_hash IN (${owned})) + (SELECT COUNT(*) FROM friendships WHERE owner_a IN (${owned}) OR owner_b IN (${owned})) AS remaining_test_rows;`;
  const verification = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'blur', '--remote', '--command', verificationSql, '--json'], {
    encoding: 'utf8', env: { ...process.env, WRANGLER_LOG_PATH: '.wrangler/logs', WRANGLER_SEND_METRICS: 'false' }, timeout: 60000,
  });
  if (verification.status !== 0 || !/"remaining_test_rows"\s*:\s*0/.test(verification.stdout)) {
    throw new Error(`Temporary data cleanup needs verification using the scoped owners in ${cleanupFile}`);
  }
  unlinkSync(cleanupFile);
  console.log('✓ Both temporary production identities and all their test data removed');
}
