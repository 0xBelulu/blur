import { useState } from 'react';
import { ArrowRight, Check, ChevronRight, Globe, LockKeyhole, Users } from 'lucide-react';
import { PersonalModal } from '../components/PersonalElements';
import ShareControls from '../components/ShareControls';
import { recordArchetype } from '../utils/portraits';
import { friendCode, resetFriendCode, savePrivacy, saveResultVisibility } from '../utils/people';

function SettingSwitch({ id, title, description, checked, disabled, onChange }) {
  return <div className="pp-setting-row">
    <div className="pp-setting-copy"><h3 id={`${id}-label`}>{title}</h3><p id={`${id}-help`}>{description}</p></div>
    <button type="button" className="pp-switch" role="switch" aria-checked={checked}
      aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} disabled={disabled} onClick={onChange}><span /></button>
  </div>;
}

export default function Settings({ account, records, pendingLegacy, onCreate, onAccount, onBackup,
  onChoosePortrait, onClearLocal, onRefresh, onRetryPending }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const registered = !!account.registered;
  const shared = records.filter((r) => r.shareId || r.pendingAction === 'revoke' || r.pendingAction === 'publish');
  const resultVisibility = account.resultVisibility || 'friends';
  const local = records.filter((r) => r.localPresent).length;
  const pending = pendingLegacy > 0 || records.some((r) => r.pendingAction);
  const run = async (action, success) => {
    setBusy(true); setMessage('');
    try { await action(); if (success) setMessage(success); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return <section className="pp-settings" aria-label="设置">
    <header className="pp-settings-intro"><div><p className="pp-eyebrow">我的空间</p><h1>设置</h1></div><p>管理你的可见范围、身份与记录。</p></header>
    {message && <p className="pp-settings-message" role="status">{message}</p>}
    <section className="pp-settings-section" aria-labelledby="privacy-title">
      <div className="pp-settings-heading"><div><h2 id="privacy-title">权限管理</h2><p>谁能看到你的结果，怎样与你成为好友。</p></div></div>
      <div className="pp-settings-items">
        <div className="pp-permission">
          <div className="pp-permission-head"><div><h3 id="result-permission-label">测试结果</h3><p id="result-permission-help">个人空间展示的画像</p></div><button className="pp-text-button" disabled={busy} onClick={onChoosePortrait}>更换展示结果<ArrowRight size={13} /></button></div>
          <div className="pp-permission-options" role="radiogroup" aria-labelledby="result-permission-label" aria-describedby="result-permission-help">
            {[[ 'private', '仅我可见', LockKeyhole ], [ 'friends', '好友可见', Users ], [ 'public', '公开可见', Globe ]].map(([value, label, Icon]) => <button key={value}
              role="radio" aria-checked={resultVisibility === value} disabled={busy || value === 'public'}
              onClick={() => run(() => saveResultVisibility(value), `测试结果已设为${label}。`)}>
              <Icon size={16} strokeWidth={1.5} /><span>{label}</span>{value === 'public' && <small>暂未开放</small>}
            </button>)}
          </div>
          <p className="pp-permission-note">{resultVisibility === 'friends' ? registered ? '默认好友可见，展示结果会自动同步。' : '默认好友可见，创建身份后自动同步展示结果。' : '只有你能在个人空间中看到这份结果。'}原始作答仅自己可见。</p>
        </div>
        {!registered && <div className="pp-setting-notice"><p>创建身份后，可以添加好友并在设备间保存权限。</p><button className="pp-text-button" onClick={onCreate}>创建我的身份<ArrowRight size={13} /></button></div>}
        <div className="pp-permission-connections"><div className="pp-settings-subgroup"><SettingSwitch id="friend-approval" title="添加好友需要我确认" checked={!!account.requireFriendApproval}
          disabled={busy || !registered} onChange={() => run(() => savePrivacy(!account.requireFriendApproval), '好友确认方式已保存。已有好友和待处理申请保持原状。')}
          description={account.requireFriendApproval ? '开启后，新朋友需要你确认。' : '默认直接添加，拿到好友码或邀请链接即可成为好友。'} /></div>
        <div className="pp-settings-subgroup"><div className="pp-setting-row"><div className="pp-setting-copy"><h3>我的好友码</h3>{account.friendCode ? <code className="pp-settings-code">{friendCode(account.friendCode)}</code> : <p>创建身份后获得好友码</p>}</div>
          <button className="pp-text-button" disabled={busy || !registered || !account.friendCode} onClick={() => { setMessage(''); setConfirmReset(true); }}>更换<ChevronRight size={13} /></button></div><p className="pp-permission-note">更换后旧邀请失效，已有好友不受影响。</p></div></div>
        <details className="pp-permission-links"><summary>已有分享链接<span className="pp-setting-count">{shared.length}</span><ChevronRight size={14} /></summary>
          <p className="pp-permission-note">这些链接的访问权限单独生效，可在这里逐份停止分享。</p>
          {shared.length ? shared.map((r) => <div className="pp-permission-share" key={r.id}><h4>{recordArchetype(r)?.title || '测试结果'}<small>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</small></h4><ShareControls record={r} /></div>) : <p className="pp-permission-note">还没有生成过分享链接。</p>}
        </details>
      </div>
    </section>
    <div className="pp-settings-maintenance">
    <section className="pp-settings-section" aria-labelledby="identity-title">
      <div className="pp-settings-heading"><div><h2 id="identity-title">身份与备份</h2><p>换设备时，用密钥找回你。</p></div></div>
      <div className="pp-settings-items">
        <div className="pp-settings-identity"><div><strong>{account.nickname || '还没起名字'}</strong><p>{registered ? '身份已连接云端' : '目前仅在这个浏览器里'}</p></div><span className="pp-setting-tag">{registered ? '云端身份' : '本机身份'}</span></div>
        <button className="pp-entry" disabled={busy || !registered} onClick={onBackup}><span><strong>保存恢复密钥{account.backupSavedAt && <Check size={13} />}</strong><small>{account.backupSavedAt ? '已在这台设备保存过' : '保存后，换设备也能找回身份与好友'}</small></span><ChevronRight size={15} /></button>
        <button className="pp-entry" disabled={busy} onClick={onAccount}><span><strong>{registered ? '恢复或切换身份' : '创建或恢复身份'}</strong><small>用已有密钥找回身份</small></span><ChevronRight size={15} /></button>
      </div>
    </section>
    <section className="pp-settings-section" aria-labelledby="data-title">
      <div className="pp-settings-heading"><div><h2 id="data-title">记录与存储</h2><p>管理云端副本与本机数据。</p></div></div>
      <div className="pp-settings-items">
        <div className="pp-settings-storage"><strong>{local}<span>份本机记录</span></strong><p>展示结果按权限同步，其他记录逐份保存。</p></div>
        <button className="pp-entry" disabled={busy || !registered} onClick={() => run(onRefresh)}><span><strong>核实云端状态</strong><small>{account.checkStatus === 'unavailable' ? '上次连接未成功，点击重试' : '重新读取身份、画像与分享状态'}</small></span><ChevronRight size={15} /></button>
        {pending && <button className="pp-entry" disabled={busy} onClick={() => run(onRetryPending)}><span><strong>重试待处理操作</strong><small>继续尚未完成的云端删除或分享撤销</small></span><ChevronRight size={15} /></button>}
        <button className="pp-entry pp-settings-clear" disabled={busy || !local} onClick={onClearLocal}><span><strong>清空本机记录</strong><small>清除这个浏览器中的画像与答案</small></span><ChevronRight size={15} /></button>
      </div>
    </section>
    </div>
    {confirmReset && <PersonalModal title="换一个新的好友码？" busy={busy} onClose={() => { setConfirmReset(false); setMessage(''); }}>
      <p className="pp-dialog-description">旧好友码和所有旧邀请链接将立即失效。已有好友和待处理申请会保留；之后邀请朋友，请分享新的好友码。</p>
      <button className="pp-primary" disabled={busy} onClick={() => run(async () => { await resetFriendCode(); setConfirmReset(false); }, '好友码已更换。去好友页复制新的邀请吧。')}>{busy ? '正在更换…' : '确认更换'}<ArrowRight size={14} /></button>
      {message && <p className="pp-status" role="status">{message}</p>}
    </PersonalModal>}
  </section>;
}
