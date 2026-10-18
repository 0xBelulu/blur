import { api, identityOperation, syncRecord } from './cloud.js';
import { getIdentityToken, getAccountInfo, updateAccountInfo } from './identity.js';
import { getHistoryRecords } from './historyStorage.js';

export async function readPeople(path, signal) {
  const token = getIdentityToken();
  if (!token || !getAccountInfo().registered) throw new Error('先创建一个身份，就可以和朋友连接了');
  const data = await api(path, { token, signal });
  if (getIdentityToken() !== token) throw new Error('身份已切换，请重新读取');
  return data;
}

export function friendAction(path, method = 'POST', body) {
  return identityOperation(`${method}:${path}:${body?.publicId || ''}`, async (ctx) => {
    return api(path, { token: ctx.token, method, body });
  });
}

export async function selectPortrait(record, friendsVisible) {
  const token = getIdentityToken();
  if (!getAccountInfo().registered) {
    if (friendsVisible) throw new Error('先创建身份，再把画像展示给好友');
    return updateAccountInfo({ displayRecordId: record?.id || null });
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
