import { ENGINE_VERSION, QUESTION_VERSION } from '../../shared/profile.js';

const STORAGE_KEY = 'blur.history.v1';
export const CLOUD_SESSION = crypto.randomUUID();

function normalize(record) {
  if (record.localPresent !== undefined) return record;
  const hadCloudRequest = ['synced', 'pending'].includes(record.syncStatus) || record.shareId;
  return {
    ...record, localPresent: true, cloudId: hadCloudRequest ? record.id : null,
    syncStatus: record.syncStatus === 'pending' ? 'failed' : record.syncStatus || 'local',
    preview: { title: record.result?.archetype?.title, symbol: record.result?.archetype?.symbol },
  };
}

function readRecords() {
  try {
    if (typeof window === 'undefined') return [];
    const records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(records) ? records.map(normalize) : [];
  } catch { return []; }
}

function writeRecords(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent?.(new Event('blur-history-change'));
    return true;
  } catch { return false; }
}

export function getHistoryRecords() {
  return readRecords().filter((record) => !record.deletedAt)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getAllHistoryRecords() { return readRecords(); }

export function updateHistoryRecord(id, changes) {
  const records = readRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return null;
  Object.assign(record, changes);
  return writeRecords(records) ? record : null;
}

export function saveHistoryRecord(answers, result) {
  const record = {
    id: crypto.randomUUID(), createdAt: Date.now(),
    engineVersion: ENGINE_VERSION, questionVersion: QUESTION_VERSION,
    answers: structuredClone(answers), result: structuredClone(result),
    answerCount: Object.keys(answers).length,
    preview: { title: result.archetype?.title, symbol: result.archetype?.symbol },
    localPresent: true, cloudId: null, syncStatus: 'local',
  };
  // Never silently discard a local-only portrait to make room for another one.
  return writeRecords([record, ...readRecords()]) ? record : null;
}

export function deleteHistoryRecord(id) {
  return writeRecords(readRecords().filter((record) => record.id !== id));
}

export function clearHistoryRecords() { return writeRecords([]); }

export function withoutCloud(record) {
  return {
    ...record, cloudId: null, cloudOwner: null, shareId: null, nickname: '',
    syncStatus: 'local', pendingAction: null, cloudSession: null, lastVerifiedAt: null,
    cloudRevision: (record.cloudRevision || 0) + 1,
  };
}

export function removeLocalRecord(id) {
  const records = readRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return true;
  if (record.pendingAction) throw new Error('请先完成待处理的云端操作，再删除本机记录');
  if (record.cloudId && record.syncStatus !== 'synced') throw new Error('同步尚未确认，请先核实或移除云端副本，再删除本机画像');
  const next = record.cloudId ? records.map((item) => item.id === id
    ? { ...item, localPresent: false, answers: undefined, result: undefined } : item)
    : records.filter((item) => item.id !== id);
  if (!writeRecords(next)) throw new Error('无法更新本机存储，请稍后重试');
  return true;
}

export function switchHistoryIdentity() {
  const local = readRecords().filter((record) => record.localPresent && !record.deletedAt);
  return writeRecords(local.map(withoutCloud));
}

export function mergeCloudRecords(remote, owner, revisions = new Map()) {
  const local = readRecords();
  const seen = new Set();
  const protectedIds = new Set([...revisions].filter(([id, revision]) => {
    const record = local.find((item) => item.id === id);
    return !record || (record.cloudRevision || 0) !== revision;
  }).map(([id]) => id));
  if (revisions.size) {
    for (const record of local) if (!revisions.has(record.id)) protectedIds.add(record.id);
  }
  const byCloud = new Map(remote.map((record) => [record.cloudId, record]));
  const byLocal = new Map(remote.map((record) => [record.id, record]));
  const merged = local.flatMap((record) => {
    if (record.cloudOwner && record.cloudOwner !== owner) return [record];
    const cloud = byCloud.get(record.cloudId) || byLocal.get(record.id);
    if (cloud) seen.add(cloud.cloudId);
    if (protectedIds.has(record.id) || (record.pendingAction && record.pendingAction !== 'publish') || record.deletedAt) return [record];
    if (cloud) return [{ ...record, cloudId: cloud.cloudId, cloudOwner: owner,
      nickname: cloud.nickname, shareId: cloud.shareId, syncStatus: 'synced', pendingAction: null,
      cloudSession: CLOUD_SESSION, lastVerifiedAt: Date.now() }];
    if (record.cloudId) return record.localPresent ? [withoutCloud(record)] : [];
    return [record];
  });
  for (const cloud of remote) {
    if (!seen.has(cloud.cloudId) && !protectedIds.has(cloud.id)) {
      merged.push({ ...cloud, localPresent: false, cloudOwner: owner, syncStatus: 'synced',
        cloudSession: CLOUD_SESSION, lastVerifiedAt: Date.now() });
    }
  }
  if (!writeRecords(merged)) throw new Error('本机存储空间不足，云端记录尚未写入列表');
}
