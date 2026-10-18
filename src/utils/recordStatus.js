import { CLOUD_SESSION } from './historyStorage.js';

export function recordStatus(record) {
  const verified = record.cloudSession === CLOUD_SESSION;
  let storage = record.localPresent ? '仅在本机' : '仅在云端';
  let sharing = '未公开';
  let tone = 'local';
  if (record.cloudId) {
    storage = verified ? (record.localPresent ? '本机 + 云端' : '仅在云端') : '云端状态待核实';
    tone = verified ? 'cloud' : 'pending';
  }
  if (record.syncStatus === 'pending') { storage = '同步待确认'; tone = 'pending'; }
  if (record.syncStatus === 'failed') { storage = '同步未确认'; tone = 'pending'; }
  if (record.shareId) sharing = verified ? '分享中' : '上次确认分享中';
  if (record.pendingAction === 'publish') { sharing = '开启分享待确认'; tone = 'pending'; }
  if (record.pendingAction === 'revoke') { sharing = '停止分享待确认'; tone = 'pending'; }
  if (record.pendingAction === 'delete-cloud' || record.deletedAt) { storage = '云端移除待确认'; tone = 'pending'; }
  return { storage, sharing, tone, verified };
}
