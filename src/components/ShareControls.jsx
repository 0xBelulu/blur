import { useState } from 'react';
import { Share2, Copy, Link2Off } from 'lucide-react';
import GlassButton from './GlassButton';
import { publishRecord, revokeShare, shareUrl, syncRecord } from '../utils/cloud';

export default function ShareControls({ record }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState(record.nickname || '');
  const [url, setUrl] = useState('');
  const link = record.shareId ? shareUrl(record.shareId) : '';

  const run = async (action) => {
    setBusy(true);
    setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="w-full space-y-3 text-xs">
      <p className="text-blur-text-muted" role="status">
        {record.pendingAction === 'revoke' ? '撤销待确认，原链接可能仍可访问' :
          record.syncStatus === 'synced' ? '画像已同步云端' :
          record.syncStatus === 'pending' ? '画像已保存在本机，等待同步' : '画像仅保存在本机'}
      </p>
      {!link && <label className="flex items-center gap-3 text-blur-text-muted">
        分享昵称
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24}
          placeholder="选填" className="min-w-0 rounded-xl border border-blur-border bg-white/40 px-3 py-2 text-blur-text outline-blur-accent" />
      </label>}
      <div className="flex flex-wrap gap-2">
        {!link ? <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => {
          const saved = await publishRecord(record, nickname);
          setUrl(shareUrl(saved.shareId));
          setMessage('分享已开启，可以复制下方链接');
        })}><span className="flex items-center gap-2"><Share2 size={14} />{busy ? '正在开启分享…' : '分享画像'}</span></GlassButton> : <>
          <GlassButton variant="secondary" disabled={busy || Boolean(record.pendingAction)} onClick={() => run(async () => {
            setUrl(link);
            await navigator.clipboard.writeText(link);
            setMessage('分享链接已复制');
          })}><span className="flex items-center gap-2"><Copy size={14} />复制分享链接</span></GlassButton>
          {navigator.share && <GlassButton variant="secondary" disabled={busy || Boolean(record.pendingAction)} onClick={() => run(async () => {
            try { await navigator.share({ title: '查看我的性格 · Blur', url: link }); }
            catch (error) { if (error.name !== 'AbortError') throw error; }
          })}>发送给朋友</GlassButton>}
          <GlassButton variant="ghost" disabled={busy} onClick={() => run(async () => {
            await revokeShare(record); setUrl(''); setMessage('分享已撤销');
          })}><span className="flex items-center gap-2"><Link2Off size={14} />撤销分享</span></GlassButton>
        </>}
        {record.syncStatus === 'pending' && <GlassButton variant="ghost" disabled={busy} onClick={() => run(async () => {
          await syncRecord(record); setMessage('同步成功');
        })}>重试同步</GlassButton>}
      </div>
      <p className="text-blur-text-light leading-relaxed">分享后，持有链接的人可查看本次完整画像，包括叙事与隐藏潜能；原始答案保持私密。可随时撤销分享。</p>
      {(url || link) && <label className="block text-blur-text-muted">分享链接
        <input aria-label="分享链接" readOnly value={link || url} onFocus={(event) => event.target.select()}
          className="mt-1 w-full rounded-xl border border-blur-border bg-white/40 px-3 py-2 text-blur-text" />
      </label>}
      {message && <p role="status" className="text-blur-text-muted leading-relaxed">{message}</p>}
      {message && !link && <button className="text-blur-accent underline cursor-pointer" onClick={() => run(async () => {
        await navigator.clipboard.writeText(`【Blur 人格画像】${record.result.archetype.title}\n${record.result.archetype.subtitle}`);
        setMessage('已复制文字摘要，未开启链接分享');
      })}>复制画像摘要</button>}
    </div>
  );
}
