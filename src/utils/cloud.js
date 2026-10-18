import {
  getAllHistoryRecords, updateHistoryRecord, deleteHistoryRecord, mergeCloudRecords,
} from './historyStorage.js';

const IDENTITY_KEY = 'blur.identity.v1';
const inFlight = new Map();

function identity() {
  let token = localStorage.getItem(IDENTITY_KEY);
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(IDENTITY_KEY, token);
  }
  return token;
}

export async function api(path, { method = 'GET', body, publicAccess = false, signal } = {}) {
  let response;
  try { response = await fetch(`/api${path}`, {
    method, signal: signal || AbortSignal.timeout(8000), cache: 'no-store',
    headers: {
      ...(publicAccess ? {} : { Authorization: `Bearer ${identity()}` }),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }); } catch {
    throw new Error('连接云端失败，本机画像仍可正常使用，请稍后重试');
  }
  const data = await response.json().catch(() => null);
  // A static-only deployment may answer an unknown API path with index.html (200).
  if (!response.ok || !data) {
    const error = new Error(data?.message || '云端暂不可用，本机画像仍可正常使用');
    error.status = response.status;
    error.requestId = data?.requestId || response.headers.get('X-Request-Id');
    throw error;
  }
  return data;
}

function current(id) { return getAllHistoryRecords().find((record) => record.id === id); }

export function syncRecord(record) {
  if (inFlight.has(record.id)) return inFlight.get(record.id);
  const task = (async () => {
    if (current(record.id)?.deletedAt) return;
    updateHistoryRecord(record.id, { syncStatus: 'pending' });
    const saved = await api(`/records/${record.id}`, { method: 'PUT', body: {
      createdAt: record.createdAt, engineVersion: record.engineVersion,
      questionVersion: record.questionVersion, answers: record.answers, result: record.result,
    } });
    updateHistoryRecord(record.id, { syncStatus: 'synced', shareId: saved.shareId, nickname: saved.nickname });
    return saved;
  })().finally(() => inFlight.delete(record.id));
  inFlight.set(record.id, task);
  return task;
}

export async function publishRecord(record, nickname) {
  if (record.pendingAction) throw new Error('请先完成待处理的云端操作');
  if (record.syncStatus !== 'synced') await syncRecord(record);
  const saved = await api(`/records/${record.id}/share`, { method: 'POST', body: { nickname } });
  updateHistoryRecord(record.id, { shareId: saved.shareId, nickname: saved.nickname, syncStatus: 'synced' });
  return saved;
}

export async function revokeShare(record) {
  updateHistoryRecord(record.id, { pendingAction: 'revoke' });
  await api(`/records/${record.id}/share`, { method: 'DELETE' }).catch((error) => {
    if (error.status !== 404) throw error;
  });
  updateHistoryRecord(record.id, { shareId: null, pendingAction: null });
}

export async function removeRecord(record) {
  if (record.syncStatus === 'local' || !record.syncStatus) {
    deleteHistoryRecord(record.id);
    return;
  }
  // Retain a local tombstone until the server confirms deletion.
  updateHistoryRecord(record.id, { deletedAt: Date.now(), pendingAction: 'delete' });
  await inFlight.get(record.id)?.catch(() => {});
  await api(`/records/${record.id}`, { method: 'DELETE' }).catch((error) => {
    if (error.status !== 404) throw error;
  });
  deleteHistoryRecord(record.id);
}

export async function flushPending() {
  // Stop after a network failure instead of issuing one failing request per record.
  for (const record of getAllHistoryRecords()) {
    if (record.deletedAt) await removeRecord(record);
    else if (record.pendingAction === 'revoke') await revokeShare(record);
    else if (record.syncStatus === 'pending') await syncRecord(record);
  }
}

export async function refreshCloudHistory() {
  if (!localStorage.getItem(IDENTITY_KEY)) return;
  await flushPending();
  const { records } = await api('/records');
  mergeCloudRecords(records);
}

export function shareUrl(shareId) {
  return `${window.location.origin}${window.location.pathname}#view/${shareId}`;
}
