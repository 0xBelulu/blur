import { useState } from 'react';
import { Fingerprint, Download, UserRound } from 'lucide-react';
import GlassButton from './GlassButton';
import { saveNickname, exportRecoveryKey, restoreIdentity } from '../utils/cloud';
import { updateAccountInfo } from '../utils/identity';
import { friendCode } from '../utils/people';

export default function AccountPanel({ account, showNickname = false }) {
  const [draftNickname, setDraftNickname] = useState(null);
  const nickname = draftNickname ?? account.nickname ?? '';
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
  return <section className="border border-blur-border/60 bg-white/40 p-5 sm:p-6 space-y-5 rounded-none sm:rounded-sm">
    <div className="flex gap-4 items-start">
      <span className="border border-blur-border/60 bg-white/60 p-2.5 text-blur-accent shrink-0"><Fingerprint size={22} /></span>
      <div className="min-w-0"><p className="text-[10px] tracking-wide text-blur-text-light">留在这里的身份</p>
        <h2 className="text-base font-medium mt-1">{account.nickname || '未命名身份'}</h2>
        {account.friendCode && <p className="text-xs font-mono text-blur-text-muted mt-0.5">好友码：{friendCode(account.friendCode)}</p>}
        <p className="text-xs text-blur-text-muted mt-2 leading-relaxed">{account.registered ? '这个浏览器记得你。换设备时，用恢复密钥找回身份。' : '目前仅在这个浏览器使用。可以先创建身份，或用密钥找回已有身份。'}</p>
      </div>
    </div>
    {showNickname && <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
      event.preventDefault(); run(async () => { await saveNickname(nickname); setDraftNickname(null); setMessage(account.registered ? '昵称已保存到这个身份' : '昵称已保存在本机'); });
    }}>
      <label className="text-xs text-blur-text-muted flex-1 min-w-40">展示昵称（选填）
        <input value={nickname} onChange={(event) => setDraftNickname(event.target.value)} maxLength={24}
          placeholder="分享时也可以再改" className="mt-2 block w-full border border-blur-border bg-white/40 px-3 py-2 text-blur-text outline-blur-accent text-xs" />
      </label>
      <button disabled={busy} className="border border-blur-border/60 bg-white/50 px-3.5 py-2 text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"><UserRound size={13} />保存昵称</button>
    </form>}
    <div className="border-t border-blur-border/40 pt-4 space-y-4">
      {account.registered && <div className="space-y-2"><h3 className="text-xs font-medium tracking-wide text-blur-text">保存恢复密钥</h3>
        <p className="text-xs text-blur-text-muted leading-relaxed">恢复密钥用于换设备或找回云端画像。相当于身份钥匙，请妥善保存。</p>
        <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => { setRecoveryKey(await exportRecoveryKey()); })}>显示我的恢复密钥</GlassButton>
        {recoveryKey && <div className="space-y-2">
          <textarea aria-label="我的恢复密钥" readOnly value={recoveryKey} onFocus={(event) => event.target.select()}
            className="w-full rounded-xl bg-white/60 border border-blur-border p-3 text-xs font-mono break-all" rows={3} />
          <div className="flex flex-wrap gap-3 text-xs">
            <button className="text-blur-accent underline cursor-pointer" onClick={() => run(async () => {
              await navigator.clipboard.writeText(recoveryKey); updateAccountInfo({ backupSavedAt: Date.now() }); setMessage('恢复密钥已复制，请自行妥善保存');
            })}>复制密钥</button>
            <button className="text-blur-accent underline cursor-pointer inline-flex items-center gap-1" onClick={() => {
              const url = URL.createObjectURL(new Blob([recoveryKey], { type: 'text/plain;charset=utf-8' }));
              const link = document.createElement('a'); link.href = url; link.download = 'blur-identity-key.txt'; link.click();
              URL.revokeObjectURL(url);
              updateAccountInfo({ backupSavedAt: Date.now() });
            }}><Download size={12} />下载密钥文件</button>
          </div>
        </div>}
      </div>}
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
          className="border border-blur-border/60 bg-white/50 px-4 py-2 text-xs cursor-pointer disabled:opacity-40">{busy ? '正在验证…' : '恢复这个身份'}</button>
      </form>
    </div>
    {message && <p role="status" className="text-xs text-blur-text-muted leading-relaxed">{message}</p>}
  </section>;
}
