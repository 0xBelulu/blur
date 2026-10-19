import { recordStatus } from '../utils/recordStatus';

// 记录状态用一行注脚表达，而不是彩色胶囊：
// 圆点区分「在哪」「是否分享」，文字随页面灰调，只有待确认状态才略微偏暖。
export default function RecordBadges({ record }) {
  const status = recordStatus(record);
  const shared = Boolean(record.shareId) || record.pendingAction === 'publish';
  return <span className="pp-record-status" data-tone={status.tone}>
    <span className="pp-record-status-item">
      <i data-dot={record.cloudId ? 'cloud' : 'local'} aria-hidden="true" />{status.storage}
    </span>
    <span className="pp-record-status-sep" aria-hidden="true">·</span>
    <span className="pp-record-status-item" data-shared={shared ? 'true' : 'false'}>
      {shared && <i data-dot="share" aria-hidden="true" />}{status.sharing}
    </span>
  </span>;
}
