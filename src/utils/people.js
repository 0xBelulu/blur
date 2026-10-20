import { api, identityOperation, syncRecord } from './cloud.js';
import { getIdentityToken, getAccountInfo, updateAccountInfo } from './identity.js';
import { getHistoryRecords } from './historyStorage.js';

export async function readPeople(path, signal) {
  const token = getIdentityToken();
  if (!token || !getAccountInfo().registered) throw new Error('先把身份存到云端，就可以和朋友连接了');
  const data = await api(path, { token, signal });
  if (getIdentityToken() !== token) throw new Error('身份已切换，请重新读取');
  return data;
}

export function friendAction(path, method = 'POST', body) {
  return identityOperation(`${method}:${path}:${JSON.stringify(body)}`, async (ctx) => {
    return api(path, { token: ctx.token, method, body });
  });
}

function accountAction(path, method, body) {
  return identityOperation(`${method}:${path}:${JSON.stringify(body)}`, async (ctx) => {
    const account = await api(path, { token: ctx.token, method, body });
    if (getIdentityToken() !== ctx.token) throw new Error('身份已切换，请重新操作');
    return updateAccountInfo({ ...account, checkStatus: 'verified' });
  });
}

export function savePrivacy(requireFriendApproval) {
  return accountAction('/account/privacy', 'PUT', { requireFriendApproval });
}

export function resetFriendCode() {
  return accountAction('/account/friend-code', 'POST');
}

export async function saveResultVisibility(resultVisibility) {
  if (!['private', 'friends'].includes(resultVisibility)) throw new Error('公开可见暂未开放');
  if (!getAccountInfo().registered) return updateAccountInfo({ resultVisibility });
  await accountAction('/account/privacy', 'PUT', { resultVisibility });
  return getAccountInfo();
}

export async function selectPortrait(record, friendsVisible) {
  const token = getIdentityToken();
  if (!getAccountInfo().registered) {
    return updateAccountInfo({ displayRecordId: record?.id || null,
      ...(typeof friendsVisible === 'boolean' ? { resultVisibility: friendsVisible ? 'friends' : 'private' } : {}),
    });
  }
  if (record && (!record.cloudId || record.syncStatus !== 'synced')) await syncRecord(record);
  if (getIdentityToken() !== token) throw new Error('身份已切换，请重新选择');
  return identityOperation(`portrait:${record?.id || ''}:${friendsVisible}`, async (ctx) => {
    const current = record && getHistoryRecords().find((r) => r.id === record.id);
    if (record && !current?.cloudId) throw new Error('这份记录已不存在，请重新选择');
    const account = await api('/account/portrait', { token: ctx.token, method: 'PUT', body: {
      portraitId: current?.cloudId || null, friendsVisible,
    } });
    if (getIdentityToken() !== ctx.token) throw new Error('身份已切换，请重新选择');
    return updateAccountInfo({ ...account, displayRecordId: record?.id || null, checkStatus: 'verified' });
  });
}

export function friendCode(code = '') { return code.match(/.{1,4}/g)?.join('-') || ''; }
export function inviteUrl(code) { return `${window.location.origin}${window.location.pathname}#invite/${code}`; }
