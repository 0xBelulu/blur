import { useState } from 'react';
import { CloudUpload, Copy, Share2, CloudOff, Link2Off } from 'lucide-react';
import GlassButton from './GlassButton';
import RecordBadges from './RecordBadges';
import { publishRecord, revokeShare, shareUrl, syncRecord, removeCloudCopy, refreshCloudHistory } from '../utils/cloud';
import { getAccountInfo } from '../utils/identity';

export default function ShareControls({ record }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState(record.nickname || getAccountInfo().nickname || '');
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const link = record.shareId ? shareUrl(record.shareId) : '';
  const synchronized = record.cloudId && record.syncStatus === 'synced';

  const run = async (action) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return <div className="w-full space-y-4 text-xs">
    <RecordBadges record={record} />
    {record.pendingAction && <p role="status" className="text-amber-800 leading-relaxed">云端操作尚未确认，分享可能仍处于开启状态。请重试或核实云端状态。</p>}
    {!synchronized && !record.pendingAction && record.localPresent && <div className="space-y-3">
      <p className="text-blur-text-muted leading-relaxed">画像与答案默认只留在本机。点击同步，才会将这一份存入云端；同步不会开启分享。</p>
      <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => {
        await syncRecord(record); setMessage('云端副本已保存，尚未公开。现在可以选择开启分享。');
      })}><span className="flex items-center gap-2"><CloudUpload size={14} />{busy ? '正在同步…' : record.cloudId ? '重试同步' : '同步到云端'}</span></GlassButton>
    </div>}
    {synchronized && !link && (!record.pendingAction || record.pendingAction === 'publish') && <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-3 text-blur-text-muted">分享昵称
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} placeholder="选填"
          className="min-w-0 rounded-xl border border-blur-border bg-white/40 px-3 py-2 text-blur-text outline-blur-accent" />
      </label>
      <p className="text-blur-text-muted leading-relaxed">开启后，持有链接的人可查看本次完整画像，包括叙事与隐藏潜能。原始答案保持私密。</p>
      <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => {
        await publishRecord(record, nickname); setMessage('分享已开启，可以复制链接发给朋友');
      })}><span className="flex items-center gap-2"><Share2 size={14} />{record.pendingAction === 'publish' ? '重试开启分享' : '开启分享'}</span></GlassButton>
      {record.pendingAction === 'publish' && <button disabled={busy} className="text-blur-text-muted underline cursor-pointer ml-3" onClick={() => run(async () => {
        await revokeShare(record); setMessage('停止分享已确认');
      })}>停止可能已开启的分享</button>}
    </div>}
    {link && <div className="flex flex-wrap gap-2">
      <GlassButton variant="secondary" disabled={busy || Boolean(record.pendingAction)} onClick={() => run(async () => {
        await navigator.clipboard.writeText(link); setMessage('分享链接已复制');
      })}><span className="flex items-center gap-2"><Copy size={14} />复制分享链接</span></GlassButton>
      {navigator.share && <GlassButton variant="secondary" disabled={busy || Boolean(record.pendingAction)} onClick={() => run(async () => {
        try { await navigator.share({ title: '查看我的性格 · Blur', url: link }); }
        catch (error) { if (error.name !== 'AbortError') throw error; }
      })}>发送给朋友</GlassButton>}
      <GlassButton variant="ghost" disabled={busy || record.pendingAction === 'delete-cloud'} onClick={() => run(async () => {
        await revokeShare(record); setMessage('分享已停止；请以上方最新存储状态为准');
      })}><span className="flex items-center gap-2"><Link2Off size={14} />{record.pendingAction === 'revoke' ? '重试停止分享' : '停止分享'}</span></GlassButton>
    </div>}
    {link && <label className="block text-blur-text-muted">画像分享链接（不是身份恢复密钥）
      <input aria-label="分享链接" readOnly value={link} onFocus={(event) => event.target.select()}
        className="mt-2 w-full rounded-xl border border-blur-border bg-white/40 px-3 py-2 text-blur-text" />
    </label>}
    {!link && record.pendingAction === 'revoke' && <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => {
      await revokeShare(record); setMessage('停止分享已确认');
    })}>重试停止分享</GlassButton>}
    {record.cloudId && <div className="pt-3 border-t border-blur-border space-y-3">
      <div className="flex flex-wrap gap-4">
        <button disabled={busy} className="text-blur-text-muted underline cursor-pointer disabled:opacity-40" onClick={() => run(async () => {
          await refreshCloudHistory(); setMessage('云端状态已重新核实');
        })}>核实云端状态</button>
        <button disabled={busy} className="text-blur-text-muted cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40"
          onClick={() => setConfirmRemoval((value) => !value)}><CloudOff size={13} />移除云端副本</button>
      </div>
      {confirmRemoval && <div className="rounded-xl border border-blur-border bg-white/30 p-3 space-y-3">
        <p className="text-blur-text-muted leading-relaxed">{record.localPresent ? '本机画像与答案保留。' : '会先将完整画像保存到本机。'}云端副本将移除，对应分享链接和好友展示同时停用。</p>
        <div className="flex gap-4">
          <button disabled={busy} className="text-blur-accent cursor-pointer disabled:opacity-40" onClick={() => run(async () => {
            await removeCloudCopy(record); setConfirmRemoval(false); setMessage('云端副本已移除，画像与答案保留在本机');
          })}>{busy ? '正在处理…' : record.pendingAction === 'delete-cloud' ? '重试移除云端' : '确认移除云端'}</button>
          <button onClick={() => setConfirmRemoval(false)} className="text-blur-text-muted cursor-pointer">取消</button>
        </div>
      </div>}
    </div>}
    {record.lastVerifiedAt && <p className="text-[10px] text-blur-text-light">上次云端确认：{new Date(record.lastVerifiedAt).toLocaleString('zh-CN')}</p>}
    {message && <p role="status" className="text-blur-text-muted leading-relaxed">{message}</p>}
    {!link && record.result && <button className="text-blur-text-muted underline cursor-pointer" disabled={busy} onClick={() => run(async () => {
      await navigator.clipboard.writeText(`【Blur 人格画像】${record.result.archetype.title}\n${record.result.archetype.subtitle}`);
      setMessage('已复制文字摘要，没有上传或公开画像');
    })}>仅复制文字摘要</button>}
  </div>;
}
