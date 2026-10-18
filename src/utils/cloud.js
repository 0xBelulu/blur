import {
  CLOUD_SESSION, getAllHistoryRecords, updateHistoryRecord, deleteHistoryRecord,
  mergeCloudRecords, withoutCloud, switchHistoryIdentity,
} from './historyStorage.js';
import {
  getIdentityToken, identityId, ensureLocalIdentity, getAccountInfo, updateAccountInfo,
  formatRecoveryKey, parseRecoveryKey, adoptIdentity,
} from './identity.js';

const operations = new Map();
const ACCOUNT_OPERATION = Symbol('account');
let accountRevision = 0;

// Account/friend mutations participate in the same identity-switch guard as uploads.
export function identityOperation(action, callback) {
  const previous = operations.get(ACCOUNT_OPERATION);
  const expectedToken = getIdentityToken(true);
  if (previous?.action === action && previous.token === expectedToken) return previous.promise;
  accountRevision += 1;
  const promise = (async () => {
    if (previous) await previous.promise.catch(() => {});
    assertIdentity({ token: expectedToken });
    const ctx = await context();
    const value = await callback(ctx);
    assertIdentity(ctx);
    return value;
  })().finally(() => {
    accountRevision += 1;
    if (operations.get(ACCOUNT_OPERATION)?.promise === promise) operations.delete(ACCOUNT_OPERATION);
  });
  operations.set(ACCOUNT_OPERATION, { action, promise, token: expectedToken });
  return promise;
}

export async function api(path, { method = 'GET', body, publicAccess = false, signal, token } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal: signal || AbortSignal.timeout(8000), cache: 'no-store',
      headers: {
        ...(publicAccess ? {} : { Authorization: `Bearer ${token || getIdentityToken(true)}` }),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('连接云端失败，本机画像仍可正常使用，请稍后重试'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(data?.message || '云端暂不可用，本机画像仍可正常使用');
    error.status = response.status;
    error.requestId = data?.requestId || response.headers.get('X-Request-Id');
    throw error;
  }
  return data;
}

function current(id) { return getAllHistoryRecords().find((record) => record.id === id); }
function write(record, changes) {
  const saved = updateHistoryRecord(record.id, { ...changes, cloudRevision: (current(record.id)?.cloudRevision || 0) + 1 });
  if (!saved) throw new Error('无法保存本机操作状态，请检查浏览器存储空间');
  return saved;
}
function verified(changes = {}) {
  return { ...changes, cloudSession: CLOUD_SESSION, lastVerifiedAt: Date.now() };
}
async function context() {
  const account = await ensureLocalIdentity();
  return { token: getIdentityToken(), id: account.id };
}
function assertIdentity(ctx) {
  if (getIdentityToken() !== ctx.token) throw new Error('身份已切换，请刷新云端状态后再操作');
}
function owned(record, ctx) {
  if (!record) throw new Error('这份本机记录已不存在');
  if (record.cloudOwner && record.cloudOwner !== ctx.id) throw new Error('这份云端副本属于另一个身份，请先恢复对应身份');
  return record;
}

function recordOperation(record, action, callback) {
  const previous = operations.get(record.id);
  const expectedToken = getIdentityToken(true);
  if (previous?.action === action && previous.token === expectedToken) return previous.promise;
  const promise = (async () => {
    if (previous) await previous.promise.catch(() => {});
    assertIdentity({ token: expectedToken });
    const ctx = await context();
    return callback(owned(current(record.id), ctx), ctx);
  })().finally(() => { if (operations.get(record.id)?.promise === promise) operations.delete(record.id); });
  operations.set(record.id, { action, promise, token: expectedToken });
  return promise;
}

export function syncRecord(record) {
  return recordOperation(record, 'sync', async (local, ctx) => {
    if (local.pendingAction) throw new Error('请先完成待处理的云端操作');
    if (!local.localPresent || !local.result) throw new Error('请先将画像保存到本机');
    const cloudId = local.cloudId || crypto.randomUUID();
    write(local, { cloudId, cloudOwner: ctx.id, syncStatus: 'pending', cloudSession: null });
    try {
      const saved = await api(`/records/${cloudId}`, { token: ctx.token, method: 'PUT', body: {
        localId: local.id, createdAt: local.createdAt, engineVersion: local.engineVersion,
        questionVersion: local.questionVersion, answers: local.answers, result: local.result,
        accountNickname: getAccountInfo().nickname || '',
        accountBio: getAccountInfo().bio || '',
      } });
      assertIdentity(ctx);
      write(local, verified({ cloudId: saved.cloudId, cloudOwner: ctx.id, syncStatus: 'synced', shareId: saved.shareId, nickname: saved.nickname }));
      updateAccountInfo({ registered: true });
      return saved;
    } catch (error) {
      if (getIdentityToken() === ctx.token && current(local.id)) {
        write(local, error.status === 404 ? withoutCloud(current(local.id)) : { syncStatus: 'failed', cloudSession: null });
      }
      throw error;
    }
  });
}

export function publishRecord(record, nickname) {
  return recordOperation(record, 'publish', async (local, ctx) => {
    if (local.pendingAction && local.pendingAction !== 'publish') throw new Error('请先完成待处理的云端操作');
    if (!local.cloudId || local.syncStatus !== 'synced') throw new Error('请先同步到云端，再开启分享');
    write(local, { pendingAction: 'publish', cloudSession: null });
    let saved;
    try { saved = await api(`/records/${local.cloudId}/share`, { token: ctx.token, method: 'POST', body: { nickname } }); }
    catch (error) {
      if (getIdentityToken() === ctx.token) write(local, { cloudSession: null });
      throw error;
    }
    assertIdentity(ctx);
    write(local, verified({ shareId: saved.shareId, nickname: saved.nickname, pendingAction: null }));
    return saved;
  });
}

export function revokeShare(record) {
  return recordOperation(record, 'revoke', async (local, ctx) => {
    if (!local.cloudId) return;
    write(local, { pendingAction: 'revoke', cloudSession: null });
    let missing = false;
    await api(`/records/${local.cloudId}/share`, { token: ctx.token, method: 'DELETE' }).catch((error) => {
      if (error.status !== 404) throw error;
      missing = true;
    });
    assertIdentity(ctx);
    if (missing) forgetCloud(current(local.id));
    else write(local, verified({ shareId: null, pendingAction: null }));
  });
}

function forgetCloud(record) {
  if (record.localPresent && !record.deletedAt) write(record, withoutCloud(record));
  else if (!deleteHistoryRecord(record.id)) throw new Error('云端操作已完成，但本机状态未保存，请重新核实');
}

export function removeCloudCopy(record) {
  return recordOperation(record, 'delete-cloud', async (local, ctx) => {
    if (!local.cloudId) return;
    write(local, { pendingAction: 'delete-cloud', cloudSession: null });
    if (!local.localPresent && !local.deletedAt) {
      // A recovered summary is not a backup. Persist the full snapshot before deleting it remotely.
      let saved;
      try { saved = await api(`/records/${local.cloudId}`, { token: ctx.token }); }
      catch (error) {
        if (error.status === 404) { assertIdentity(ctx); forgetCloud(current(local.id)); }
        throw error;
      }
      assertIdentity(ctx);
      write(local, { ...saved, id: local.id, localPresent: true, cloudOwner: ctx.id });
    }
    await api(`/records/${local.cloudId}`, { token: ctx.token, method: 'DELETE' }).catch((error) => {
      if (error.status !== 404) throw error;
    });
    assertIdentity(ctx);
    forgetCloud(current(local.id));
  });
}

export function downloadRecord(record) {
  return recordOperation(record, 'download', async (local, ctx) => {
    if (!local.cloudId) throw new Error('这份记录没有云端副本');
    const saved = await api(`/records/${local.cloudId}`, { token: ctx.token });
    assertIdentity(ctx);
    const result = write(local, verified({ ...saved, id: local.id, localPresent: true, cloudOwner: ctx.id, syncStatus: 'synced' }));
    return result;
  });
}

export async function flushPending() {
  // Explicit retries of prior deletion/revocation only. Never upload a portrait here.
  for (const record of getAllHistoryRecords()) {
    if (record.pendingAction === 'delete-cloud' || record.deletedAt) await removeCloudCopy(record);
    else if (record.pendingAction === 'revoke') await revokeShare(record);
  }
}

export async function refreshCloudHistory() {
  const token = getIdentityToken();
  if (!token) return;
  const owner = await identityId(token);
  const revision = accountRevision;
  const revisions = new Map(getAllHistoryRecords().map((record) => [record.id, record.cloudRevision || 0]));
  try {
    let account;
    try { account = await api('/account', { token }); } catch (error) {
      if (error.status !== 404) throw error;
      account = { id: owner, registered: false, nickname: getAccountInfo().nickname || '' };
    }
    const records = account.registered === false ? [] : (await api('/records?summary=1', { token })).records;
    assertIdentity({ token });
    mergeCloudRecords(records, owner, revisions);
    if (revision === accountRevision && !operations.has(ACCOUNT_OPERATION)) updateAccountInfo({ ...account,
      registered: account.registered !== false, lastVerifiedAt: Date.now(), checkStatus: 'verified' });
  } catch (error) {
    if (getIdentityToken() === token) {
      for (const record of getAllHistoryRecords()) {
        if (record.cloudId && (!record.cloudOwner || record.cloudOwner === owner)) updateHistoryRecord(record.id, { cloudSession: null });
      }
      updateAccountInfo({ checkStatus: 'unavailable' });
    }
    throw error;
  }
}

export async function saveNickname(nickname) {
  const clean = nickname.trim();
  if (clean.length > 24) throw new Error('昵称最多 24 个字');
  await ensureLocalIdentity();
  if (getAccountInfo().registered) {
    await saveProfile({ nickname: clean, bio: getAccountInfo().bio || '' });
  } else updateAccountInfo({ nickname: clean });
}

export function exportRecoveryKey() {
  return identityOperation('recovery-export', async (ctx) => {
    let account;
    try { account = await api('/account', { token: ctx.token }); }
    catch (error) {
      if (error.status !== 404) throw error;
      account = await api('/account', { token: ctx.token, method: 'POST', body: { nickname: getAccountInfo().nickname || '', bio: getAccountInfo().bio || '' } });
    }
    assertIdentity(ctx);
    updateAccountInfo({ ...account, registered: true });
    return formatRecoveryKey(ctx.token);
  });
}

export async function restoreIdentity(key) {
  if (operations.size || getAllHistoryRecords().some((record) => record.pendingAction || record.deletedAt)) {
    throw new Error('请先完成正在进行或待确认的云端操作，再恢复其他身份');
  }
  const originalToken = getIdentityToken();
  const token = parseRecoveryKey(key);
  const account = await api('/account', { token });
  const { records } = await api('/records?summary=1', { token });
  // Verify everything before switching. Recovery never uploads this device's portraits.
  if (getIdentityToken() === token) { await refreshCloudHistory(); return; }
  if (getIdentityToken() !== originalToken || operations.size || getAllHistoryRecords().some((record) => record.pendingAction || record.deletedAt)) {
    throw new Error('身份或云端操作已变化，请完成后重新恢复');
  }
  const keys = ['blur.history.v1', 'blur.identity.v1', 'blur.account.v1'];
  const before = keys.map((key) => localStorage.getItem(key));
  try {
    if (!switchHistoryIdentity()) throw new Error('本机存储无法更新，身份尚未切换');
    mergeCloudRecords(records, account.id);
    adoptIdentity(token, account);
  } catch (error) {
    // localStorage has no multi-key transaction; restore the original values on write failure.
    keys.forEach((key, index) => {
      if (before[index] === null) localStorage.removeItem(key);
      else localStorage.setItem(key, before[index]);
    });
    window.dispatchEvent?.(new Event('blur-history-change'));
    window.dispatchEvent?.(new Event('blur-account-change'));
    throw error;
  }
}

export function shareUrl(shareId) {
  return `${window.location.origin}${window.location.pathname}#view/${shareId}`;
}

export function compareUrl(shareId) {
  return `${window.location.origin}${window.location.pathname}#compare/${shareId}`;
}

export async function saveProfile({ nickname, bio = '' }, create = false) {
  const clean = nickname.trim();
  const intro = bio.trim();
  if (clean.length > 24 || intro.length > 80) throw new Error('名字最多 24 个字，简介最多 80 个字');
  if (create && !clean) throw new Error('给自己起一个展示名字吧');
  await ensureLocalIdentity();
  if (!create && !getAccountInfo().registered) return updateAccountInfo({ nickname: clean, bio: intro });
  return identityOperation(`profile:${clean}:${intro}`, async (ctx) => {
    const account = await api('/account', { token: ctx.token, method: 'POST', body: { nickname: clean, bio: intro } });
    assertIdentity(ctx);
    return updateAccountInfo({ ...account, registered: true, checkStatus: 'verified' });
  });
}

export async function saveBio(bio) {
  return saveProfile({ nickname: getAccountInfo().nickname || '', bio });
}
