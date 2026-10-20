import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, Fingerprint } from 'lucide-react';
import { useModalDismiss } from './modalDismiss';
import { exportRecoveryKey, restoreIdentity } from '../utils/cloud';
import { updateAccountInfo } from '../utils/identity';
import { copyText, COPY_MANUAL_HINT } from '../utils/clipboard';
import { friendCode } from '../utils/people';

export default function AccountPanel({ account, onCreate, initialView = 'menu', onSignOut }) {
  const dismiss = useModalDismiss();
  const [view, setView] = useState(initialView);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialView !== 'backup') return;
    let active = true;
    exportRecoveryKey().then((key) => { if (active) setRecoveryKey(key); })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [initialView]);

  const run = async (action) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const openBackup = () => {
    setView('backup');
    if (!recoveryKey) run(async () => { setRecoveryKey(await exportRecoveryKey()); });
  };

  return <section className="pp-account">
    {view === 'menu' && <>
      <header className="pp-account-head">
        <span className="pp-account-mark" aria-hidden="true"><Fingerprint size={18} strokeWidth={1.5} /></span>
        <div className="pp-account-id">
          <p className="pp-account-label">留在这里的身份<span className="pp-account-state"><i />{account.registered ? '已存到云端' : '只在这台设备'}</span></p>
          <h3 className="pp-account-name">{account.nickname || '未命名身份'}</h3>
          {account.friendCode && <p className="pp-account-code">好友码<span>{friendCode(account.friendCode)}</span></p>}
        </div>
      </header>
      <p className="pp-account-note">{account.registered ? '这个浏览器记得你。换设备时，用恢复密钥把身份带过去。' : '目前只在这个浏览器里。存到云端后朋友能找到你，也可以用密钥找回别的设备上的身份。'}</p>
      <div className="pp-account-entries">
        {!account.registered && onCreate && <button className="pp-entry" onClick={() => (dismiss ? dismiss(onCreate) : onCreate())}>
          <span><strong>把身份存到云端</strong><small>一个名字就够了，不用邮箱和密码</small></span><ArrowRight size={15} />
        </button>}
        {account.registered && <button className="pp-entry" onClick={openBackup}>
          <span><strong>保存恢复密钥</strong><small>把身份的钥匙存到别处</small></span><ArrowRight size={15} />
        </button>}
        <button className="pp-entry" onClick={() => { setMessage(''); setView('restore'); }}>
          <span><strong>{account.registered ? '换用另一个身份' : '用恢复密钥找回'}</strong><small>从另一台设备保存的密钥恢复</small></span><ArrowUpRight size={15} />
        </button>
        {account.registered && onSignOut && <button className="pp-entry" onClick={() => { setMessage(''); setView('leave'); }}>
          <span><strong>退出这台设备</strong><small>本机画像留下，云端身份仍在</small></span><ArrowUpRight size={15} />
        </button>}
      </div>
      {message && <p role="status" className="pp-account-message">{message}</p>}
    </>}

    {view === 'restore' && <div className="pp-flow">
      {initialView === 'menu' && <button className="pp-back" onClick={() => setView('menu')}><ArrowLeft size={13} />返回</button>}
      <h3 className="pp-flow-title">恢复已有身份</h3>
      <p className="pp-account-help">粘贴另一台设备保存的密钥。会切换到那个身份，本机画像仍然保留。</p>
      <textarea aria-label="输入恢复密钥" value={inputKey} onChange={(event) => setInputKey(event.target.value)}
        spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder="BLUR-…" rows={2}
        className="pp-account-input pp-account-key-input" />
      {account.registered && <label className="pp-check">
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
        我已保存当前身份的密钥，之后仍可用它找回。
      </label>}
      <div className="pp-account-links">
        <button disabled={busy || !inputKey.trim() || (account.registered && !acknowledged)}
          className="pp-primary" onClick={() => run(async () => {
            await restoreIdentity(inputKey); setInputKey(''); setMessage('身份已恢复，云端画像已列出；本机画像没有上传');
          })}>{busy ? '正在验证…' : '恢复这个身份'}<ArrowRight size={14} /></button>
      </div>
      {message && <p role="status" className="pp-account-message">{message}</p>}
    </div>}

    {view === 'leave' && <div className="pp-flow">
      {initialView === 'menu' && <button className="pp-back" onClick={() => setView('menu')}><ArrowLeft size={13} />返回</button>}
      <h3 className="pp-flow-title">退出这台设备</h3>
      <p className="pp-account-help">退出后，这个浏览器不再记得这个身份。本机画像与答案会留下，成为只属于这台设备的记录；云端身份、好友和分享链接都还在。</p>
      {!account.backupSavedAt && <p className="pp-account-message">你还没有保存恢复密钥。退出后，这个身份将无法再被找回。</p>}
      <div className="pp-account-links">
        <button className="pp-primary" disabled={busy} onClick={() => run(onSignOut)}>{busy ? '正在退出…' : '确认退出'}<ArrowRight size={14} /></button>
      </div>
      {message && <p role="status" className="pp-account-message">{message}</p>}
    </div>}

    {view === 'backup' && <div className="pp-flow">
      {initialView === 'menu' && <button className="pp-back" onClick={() => setView('menu')}><ArrowLeft size={13} />返回</button>}
      <h3 className="pp-flow-title">恢复密钥</h3>
      <p className="pp-account-help">这是这个身份的钥匙。换设备时用它找回；只留给自己，别发给别人。</p>
      {!recoveryKey && <p className="pp-account-message">{message ? <button className="pp-text-button" disabled={busy} onClick={openBackup}>重新获取密钥</button> : '正在获取密钥…'}</p>}
      {recoveryKey && <>
        <textarea aria-label="我的恢复密钥" readOnly value={recoveryKey} rows={4} spellCheck={false}
          className="pp-key" onFocus={(event) => event.target.select()} />
        <div className="pp-account-links">
          <button className="pp-text-button" onClick={() => run(async () => {
            if (await copyText(recoveryKey) === 'manual') { setMessage(COPY_MANUAL_HINT); return; }
            updateAccountInfo({ backupSavedAt: Date.now() }); setMessage('密钥已复制，请自己存好');
          })}>复制密钥</button>
          <button className="pp-text-button" onClick={() => {
            const url = URL.createObjectURL(new Blob([recoveryKey], { type: 'text/plain;charset=utf-8' }));
            const link = document.createElement('a'); link.href = url; link.download = 'blur-identity-key.txt'; link.click();
            URL.revokeObjectURL(url);
            updateAccountInfo({ backupSavedAt: Date.now() });
          }}><Download size={12} />下载文件</button>
        </div>
      </>}
      {message && <p role="status" className="pp-account-message">{message}</p>}
    </div>}
  </section>;
}
