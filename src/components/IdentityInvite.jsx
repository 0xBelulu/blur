import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, KeyRound } from 'lucide-react';
import { PersonalModal } from './PersonalElements';
import { saveProfile, exportRecoveryKey } from '../utils/cloud';
import { updateAccountInfo } from '../utils/identity';
import { friendCode } from '../utils/people';
import { noteInviteCreated, noteInviteDismissed } from '../utils/identityInvite';
import '../pages/Personal.css';

/**
 * The one place a finished result offers an identity, in place.
 * Naming happens here instead of sending people through 「我的」to a second page;
 * the success step carries the friend code and the recovery habit with it.
 */
export default function IdentityInvite({ open, account, result, onClose }) {
  const [name, setName] = useState(account?.nickname || '');
  const [code, setCode] = useState('');
  const [created, setCreated] = useState(false);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const input = useRef(null);

  // A soft keyboard jumping up over the dialog is worse than one extra tap.
  useEffect(() => {
    if (!open || created) return;
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) input.current?.focus();
  }, [open, created]);

  if (!open || (account?.registered && !created) || !result?.archetype) return null;

  const archetype = result.archetype;
  const close = () => {
    if (!created) noteInviteDismissed();
    onClose();
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true); setMessage('');
    try {
      const saved = await saveProfile({ nickname: name }, true);
      setName(saved.nickname || name.trim());
      setCode(saved.friendCode || '');
      setCreated(true);
      noteInviteCreated();
    } catch (error) {
      setMessage(error.message);
    } finally { setBusy(false); }
  };
  const revealKey = async () => {
    setBusy(true); setMessage('');
    try { setKey(await exportRecoveryKey()); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const copyKey = async () => {
    setMessage('');
    try {
      await navigator.clipboard.writeText(key);
      updateAccountInfo({ backupSavedAt: Date.now() });
      setMessage('密钥已复制，请妥善保存。');
    } catch { setMessage('无法自动复制，请手动选中密钥。'); }
  };

  const lead = created ? null : <div className="ii-lead">
    <span className="ii-symbol" style={{ '--ii-ink': (archetype.color || []).join(',') }} aria-hidden="true">{archetype.symbol}</span>
    <p>「{archetype.title}」现在还只存在这个浏览器里。</p>
  </div>;

  return <div className="personal-space identity-invite">
    <PersonalModal title={created ? `${name}，你好。` : '给这一刻留个名字'} lead={lead} onClose={close} busy={busy}>
      {!created ? <form onSubmit={submit}>
        <p className="pp-dialog-description">
          留下名字，身份就会存到云端。换手机也能找回，朋友也能用好友码找到你。不需要邮箱，也不需要密码。
        </p>
        <label>大家怎么叫你？
          <input ref={input} required maxLength={24} value={name} onChange={(event) => setName(event.target.value)}
            placeholder="一个名字就好" autoComplete="nickname" disabled={busy} />
        </label>
        {message && <p role="status" className="pp-status">{message}</p>}
        <div className="ii-actions">
          <button className="pp-primary" type="submit" disabled={busy || !name.trim()}>
            {busy ? '正在保存…' : '存下这个身份'}<ArrowRight size={15} />
          </button>
          <button className="pp-text-button" type="button" disabled={busy} onClick={close}>先不存身份，继续看</button>
        </div>
        <p className="pp-helper">画像不会跟着自动上传。想让朋友看到时，再单独把那一份存到云端。</p>
      </form> : <>
        <p className="ii-done"><Check size={17} /> 身份已经存到云端。</p>
        <p className="pp-dialog-description ii-code-label">你的好友码是</p>
        {code && <p className="pp-invite-code ii-code">{friendCode(code)}</p>}
        <p className="pp-invite-note">好友码可以分享。换设备时，用恢复密钥把这个身份带走。</p>
        {!key
          ? <button className="pp-outline" type="button" disabled={busy} onClick={revealKey}>
            <KeyRound size={14} />{busy ? '正在准备…' : '保存一份恢复密钥'}
          </button>
          : <>
            <label>恢复密钥 · 请私下保管
              <textarea readOnly rows={3} value={key} onFocus={(event) => event.target.select()} />
            </label>
            <button className="pp-outline" type="button" disabled={busy} onClick={copyKey}>复制密钥</button>
          </>}
        <p className="pp-helper">这份画像还在本机。想让朋友看到时，在结果页里点「同步到云端」。</p>
        {message && <p role="status" className="pp-status">{message}</p>}
        <div className="ii-actions">
          <button className="pp-primary" type="button" onClick={close}>继续看画像<ArrowRight size={15} /></button>
        </div>
      </>}
    </PersonalModal>
  </div>;
}
