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

// 本机空间不足时确实丢掉了东西，界面需要说出来，不能静默。
export const EVICTION_EVENT = 'blur-history-evicted';

function persist(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch { return false; }
}

// 淘汰顺序：先丢云端摘要（还能重新下载），再丢最旧的本机画像。
// 带 pendingAction 的记录正在和云端协商，丢它会留下无法核实的中间态；
// 本次要写入的那条（keep）也不参与淘汰——用户刚做完的画像不该是第一个牺牲品。
function evictionOrder(records, keep) {
  return records
    .filter((record) => !record.pendingAction && record.id !== keep)
    .sort((a, b) => (a.localPresent ? 1 : 0) - (b.localPresent ? 1 : 0)
      || (a.createdAt || 0) - (b.createdAt || 0));
}

function writeRecords(records, { keep } = {}) {
  if (persist(records)) {
    window.dispatchEvent?.(new Event('blur-history-change'));
    return true;
  }
  // localStorage 没有事务：写不下就按上面的顺序一份一份让位，直到写得进去。
  const order = evictionOrder(records, keep);
  let kept = records;
  for (let evicted = 1; evicted <= order.length && kept.length > 1; evicted += 1) {
    const victim = order[evicted - 1];
    kept = kept.filter((record) => record !== victim);
    if (!persist(kept)) continue;
    window.dispatchEvent?.(new Event('blur-history-change'));
    window.dispatchEvent?.(new CustomEvent(EVICTION_EVENT, { detail: { evicted } }));
    return true;
  }
  return false;
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
  return writeRecords(records, { keep: id }) ? record : null;
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
  // 空间不足时宁可淘汰旧记录，也不能丢掉这次刚做完的画像。
  return writeRecords([record, ...readRecords()], { keep: record.id }) ? record : null;
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
