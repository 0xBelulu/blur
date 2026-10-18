import { Cloud, HardDrive, Link2 } from 'lucide-react';
import { recordStatus } from '../utils/recordStatus';

export default function RecordBadges({ record }) {
  const status = recordStatus(record);
  const tone = status.tone === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200/70'
    : status.tone === 'cloud' ? 'bg-sky-50/70 text-sky-800 border-sky-200/60'
      : 'bg-white/50 text-blur-text-muted border-blur-border';
  return <div className="flex flex-wrap gap-2 text-[11px]">
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${tone}`}>
      {record.cloudId ? <Cloud size={12} /> : <HardDrive size={12} />}{status.storage}
    </span>
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${record.shareId ? 'bg-purple-50 text-purple-800 border-purple-200/60' : 'bg-white/30 text-blur-text-muted border-blur-border/60'}`}>
      <Link2 size={12} />{status.sharing}
    </span>
  </div>;
}
