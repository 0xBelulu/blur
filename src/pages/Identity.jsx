import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Fingerprint } from 'lucide-react';
import AtmosphereField from '../components/AtmosphereField';
import AccountPanel from '../components/AccountPanel';
import { saveProfile, exportRecoveryKey } from '../utils/cloud';
import { updateAccountInfo } from '../utils/identity';
import { friendCode } from '../utils/people';
import './Personal.css';

export default function Identity({ account, onBack, onDone }) {
  const [name, setName] = useState(account.nickname || '');
  const [bio, setBio] = useState(account.bio || '');
  const [created, setCreated] = useState(false);
  const [restore, setRestore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [keyOwner, setKeyOwner] = useState(null);
  const run = async (action) => { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="personal-space"><AtmosphereField intensity={0.34} /><div className="pp-page pp-narrow">
    <header className="pp-header"><button className="pp-text-button" onClick={onBack}><ArrowLeft size={16} />回到刚才</button><span className="pp-brand">blur</span></header>
    {!created ? <section className="pp-create pp-enter"><p className="pp-eyebrow"><Fingerprint size={18} /></p><h1>下次来，还是你。</h1>
      <p className="pp-dialog-description">给自己起个名字，让朋友能找到你。无需邮箱，也不用记密码。</p>
      {!restore && !account.registered && <form onSubmit={(e) => { e.preventDefault(); run(async () => { await saveProfile({ nickname: name, bio }, true); setCreated(true); }); }}>
        <label>展示名字<input required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} placeholder="大家平时怎么叫你？" /></label>
        <label>关于我 · 选填<textarea maxLength={80} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="喜欢什么，最近在想什么，随你。" /></label>
        <p className="pp-helper">身份会记在这个浏览器。换设备需要恢复密钥；浏览器身份和密钥都丢失时，无法找回。创建身份不会上传已有测试记录。</p>
        <button className="pp-primary" disabled={busy || !name.trim()}>{busy ? '正在创建…' : '创建我的身份'}<ArrowRight size={15} /></button>
      </form>}
      {!restore && account.registered && <button className="pp-primary" onClick={onDone}>回到我的空间<ArrowRight size={15} /></button>}
      <button className="pp-text-button pp-spaced" onClick={() => setRestore(!restore)}>{restore ? '返回创建身份' : '我有恢复密钥'}</button>
      {restore && <><AccountPanel key={account.id || 'guest'} account={account} initialView="restore" />{account.registered && <button className="pp-primary pp-spaced" onClick={onDone}>使用当前身份继续<ArrowRight size={15} /></button>}</>}
    </section> : <section className="pp-create pp-enter"><Check size={24} className="text-blur-accent" /><h1>你好，{account.nickname}。</h1><p className="pp-dialog-description">身份准备好了。你的好友码是 {friendCode(account.friendCode)}。</p>
      <button className="pp-outline" disabled={busy} onClick={() => run(async () => { const recovery = await exportRecoveryKey(); setKey(recovery); setKeyOwner(account.id); })}>保存一份恢复密钥</button>
      {key && keyOwner === account.id && <div><label>恢复密钥 · 请私下保管<textarea readOnly rows={3} value={key} onFocus={(e) => e.target.select()} /></label><button className="pp-outline" disabled={busy} onClick={() => run(async () => { await navigator.clipboard.writeText(key); updateAccountInfo({ backupSavedAt: Date.now() }); setError('密钥已复制，请妥善保存。'); })}>复制密钥</button></div>}
      <p className="pp-helper">可以稍后在「身份与备份」保存。好友码可以分享，恢复密钥相当于身份钥匙，请只留给自己。</p>
      <button className="pp-primary" onClick={onDone}>继续<ArrowRight size={15} /></button>
    </section>}
    {error && <p role="status" className="pp-status">{error}</p>}
  </div></div>;
}
