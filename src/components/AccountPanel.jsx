import { useState } from 'react';
import { Fingerprint, KeyRound, Download, UserRound } from 'lucide-react';
import GlassButton from './GlassButton';
import { saveNickname, exportRecoveryKey, restoreIdentity } from '../utils/cloud';

export default function AccountPanel({ account }) {
  const [draftNickname, setDraftNickname] = useState(null);
  const nickname = draftNickname ?? account.nickname ?? '';
  const [expanded, setExpanded] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (action) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <section className="glass rounded-3xl p-5 sm:p-7 space-y-5">
    <div className="flex gap-4 items-start">
      <span className="glass-strong rounded-2xl p-3 text-blur-accent"><Fingerprint size={24} /></span>
      <div className="min-w-0"><p className="text-[10px] tracking-[0.2em] text-blur-text-light">YOUR BLUR IDENTITY</p>
        <h2 className="text-lg font-medium mt-1">{account.nickname || '还没起昵称的你'}</h2>
        <p className="text-xs text-blur-text-muted mt-1">访客身份 · {account.id?.toUpperCase() || '正在生成'}</p>
        <p className="text-xs text-blur-text-muted mt-2 leading-relaxed">无需注册也能玩。新画像默认只保存在本机，由你决定是否同步和分享。</p>
      </div>
    </div>
    <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
      event.preventDefault(); run(async () => { await saveNickname(nickname); setDraftNickname(null); setMessage(account.registered ? '昵称已保存到这个身份' : '昵称已保存在本机'); });
    }}>
      <label className="text-xs text-blur-text-muted flex-1 min-w-40">展示昵称（选填）
        <input value={nickname} onChange={(event) => setDraftNickname(event.target.value)} maxLength={24}
          placeholder="分享时也可以再改" className="mt-2 block w-full rounded-xl border border-blur-border bg-white/40 px-3 py-2.5 text-blur-text outline-blur-accent" />
      </label>
      <button disabled={busy} className="glass rounded-xl px-4 py-2.5 text-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"><UserRound size={13} />保存昵称</button>
    </form>
    <button onClick={() => { setExpanded((value) => !value); setRecoveryKey(''); }} aria-expanded={expanded}
      className="text-xs text-blur-accent cursor-pointer flex items-center gap-2"><KeyRound size={13} />保存身份 / 在另一台设备恢复</button>
    {expanded && <div className="rounded-2xl border border-blur-border bg-white/25 p-4 space-y-5">
      <div className="space-y-2"><h3 className="text-sm font-medium">保存这个身份</h3>
        <p className="text-xs text-blur-text-muted leading-relaxed">恢复密钥可以找回云端画像。它相当于账号钥匙，只给自己保存，不要当成画像链接发给朋友。</p>
        <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => { setRecoveryKey(await exportRecoveryKey()); })}>显示我的恢复密钥</GlassButton>
        {recoveryKey && <div className="space-y-2">
          <textarea aria-label="我的恢复密钥" readOnly value={recoveryKey} onFocus={(event) => event.target.select()}
            className="w-full rounded-xl bg-white/60 border border-blur-border p-3 text-xs font-mono break-all" rows={3} />
          <div className="flex flex-wrap gap-3 text-xs">
            <button className="text-blur-accent underline cursor-pointer" onClick={() => run(async () => {
              await navigator.clipboard.writeText(recoveryKey); setMessage('恢复密钥已复制，请自行妥善保存');
            })}>复制密钥</button>
            <button className="text-blur-accent underline cursor-pointer inline-flex items-center gap-1" onClick={() => {
              const url = URL.createObjectURL(new Blob([recoveryKey], { type: 'text/plain;charset=utf-8' }));
              const link = document.createElement('a'); link.href = url; link.download = 'blur-identity-key.txt'; link.click();
              URL.revokeObjectURL(url);
            }}><Download size={12} />下载密钥文件</button>
          </div>
        </div>}
      </div>
      <form className="border-t border-blur-border pt-4 space-y-3" onSubmit={(event) => {
        event.preventDefault(); run(async () => { await restoreIdentity(inputKey); setInputKey(''); setMessage('身份已恢复，云端画像已列出；本机画像没有上传'); });
      }}>
        <h3 className="text-sm font-medium">恢复已有身份</h3>
        <p className="text-xs text-blur-text-muted leading-relaxed">输入另一台设备保存的密钥。将切换到那个身份；本机画像保留，云端画像按需下载。</p>
        <textarea aria-label="输入恢复密钥" value={inputKey} onChange={(event) => setInputKey(event.target.value)}
          spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder="BLUR-…" rows={3}
          className="w-full rounded-xl bg-white/40 border border-blur-border p-3 text-xs font-mono outline-blur-accent" />
        {account.registered && <label className="flex gap-2 items-start text-xs text-blur-text-muted leading-relaxed">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
          我已保存当前身份的恢复密钥。原身份的云端画像仍需用原密钥管理。
        </label>}
        <button disabled={busy || !inputKey.trim() || (account.registered && !acknowledged)}
          className="glass rounded-xl px-4 py-2.5 text-xs cursor-pointer disabled:opacity-40">{busy ? '正在验证…' : '恢复这个身份'}</button>
      </form>
    </div>}
    {message && <p role="status" className="text-xs text-blur-text-muted leading-relaxed">{message}</p>}
  </section>;
}
