import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ShareControls from '../components/ShareControls';
import { PersonalModal } from '../components/PersonalElements';
import { recordArchetype, displayRecord } from '../utils/portraits';
import { friendCode, resetFriendCode, savePrivacy, saveResultVisibility } from '../utils/people';

const VISIBILITY = [['private', '仅我可见'], ['friends', '好友可见'], ['public', '公开可见']];
const day = (record) => record ? new Date(record.createdAt).toLocaleDateString('zh-CN') : '';

export default function Settings({ account, records, pendingLegacy, onCreate, onAccount, onBackup, onEditProfile,
  onChoosePortrait, onClearLocal, onRefresh, onRetryPending, onSignOut, onDeleteIdentity }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [clearLocalToo, setClearLocalToo] = useState(false);
  const registered = !!account.registered;
  const shared = records.filter((r) => r.shareId || r.pendingAction === 'revoke' || r.pendingAction === 'publish');
  const resultVisibility = account.resultVisibility || 'friends';
  const local = records.filter((r) => r.localPresent).length;
  const pending = pendingLegacy > 0 || records.some((r) => r.pendingAction);
  const shown = displayRecord(records, account);
  const shownProfile = recordArchetype(shown);
  const run = async (action, success) => {
    setBusy(true); setMessage('');
    try { await action(); if (success) setMessage(success); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return <section className="pp-settings" aria-label="设置">
    <div className="pp-section-head"><div><h2>设置</h2><p>谁能看到你，以及这个身份怎么带走。</p></div></div>
    {message && <p className="pp-settings-message" role="status">{message}</p>}

    <section className="pp-group" aria-labelledby="visibility-title">
      <span className="pp-group-index" aria-hidden="true">01</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="visibility-title">谁能看到我</h3>
        <p className="pp-group-lead">画像给谁看，朋友怎么加你。</p>
        <div className="pp-rows">
          <div className="pp-row is-stacked">
            <div className="pp-row-head">
              <div className="pp-row-main">
                <strong>展示画像</strong>
                <small>{shownProfile ? `现在展示「${shownProfile.title}」· ${day(shown)}` : '还没有可以展示的记录'}</small>
              </div>
              <button className="pp-text-button" disabled={busy} onClick={onChoosePortrait}>更换<ChevronRight size={12} /></button>
            </div>
            <div className="pp-choice" role="radiogroup" aria-label="谁能看到展示画像">
              {VISIBILITY.map(([value, label]) => <button key={value} role="radio" aria-checked={resultVisibility === value}
                disabled={busy || value === 'public'} onClick={() => run(() => saveResultVisibility(value), `展示画像已设为${label}。`)}>
                {label}{value === 'public' && <small>暂未开放</small>}
              </button>)}
            </div>
            <p className="pp-note">{resultVisibility === 'friends'
              ? registered ? '好友能看到你正在展示的这一份，新记录会按此范围同步。' : '创建身份后，好友才能看到这一份。'
              : '只有你能在个人空间里看到这一份。'}原始作答始终只有自己可见。</p>
          </div>

          <div className="pp-row is-stacked">
            <div className="pp-row-main"><strong>新朋友加我</strong><small>由好友码或邀请链接发起的添加。</small></div>
            <div className="pp-choice" role="radiogroup" aria-label="新朋友加我的方式">
              <button role="radio" aria-checked={!account.requireFriendApproval} disabled={busy || !registered}
                onClick={() => run(() => savePrivacy(false), '新朋友会直接成为你的好友。')}>直接成为好友</button>
              <button role="radio" aria-checked={!!account.requireFriendApproval} disabled={busy || !registered}
                onClick={() => run(() => savePrivacy(true), '新朋友添加你后，需要你确认。')}>需要我确认</button>
            </div>
          </div>

          {!registered && <div className="pp-row">
            <div className="pp-row-main"><small>创建身份后，可以添加好友，并在设备之间同步这些设置。</small></div>
            <button className="pp-text-button" onClick={onCreate}>创建我的身份<ArrowRight size={13} /></button>
          </div>}

          <details className="pp-share-links">
            <summary>已有分享链接<span className="pp-value">{shared.length}</span><ChevronRight size={14} /></summary>
            <p className="pp-note">每条链接单独生效，可以在这里逐条停止分享。</p>
            {shared.length ? shared.map((r) => <div className="pp-permission-share" key={r.id}>
              <h4>{recordArchetype(r)?.title || '测试结果'}<small>{day(r)}</small></h4><ShareControls record={r} />
            </div>) : <p className="pp-note">还没有生成过分享链接。</p>}
          </details>
        </div>
      </div>
    </section>

    <section className="pp-group" aria-labelledby="identity-title">
      <span className="pp-group-index" aria-hidden="true">02</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="identity-title">这个身份</h3>
        <p className="pp-group-lead">名字、密钥，以及它在别的设备上的样子。</p>
        <div className="pp-rows">
          <div className="pp-row">
            <div className="pp-row-main"><strong>名字与简介</strong><small>{account.nickname || '还没起名字'} · {account.bio || '还没写介绍。'}</small></div>
            <button className="pp-text-button" onClick={onEditProfile}>编辑<ChevronRight size={12} /></button>
          </div>
          <div className="pp-row">
            <div className="pp-row-main"><strong>好友码</strong><small>{account.friendCode ? friendCode(account.friendCode) : '创建身份后获得'}</small></div>
            <button className="pp-text-button" disabled={busy || !registered || !account.friendCode} onClick={() => { setMessage(''); setConfirmReset(true); }}>更换<ChevronRight size={12} /></button>
          </div>
          <button className="pp-entry" disabled={busy || !registered} onClick={onBackup}>
            <span><strong>保存恢复密钥</strong><small>{account.backupSavedAt ? '已在这台设备保存过' : '换设备时，用它找回身份与好友'}</small></span><ChevronRight size={15} />
          </button>
          <button className="pp-entry" disabled={busy} onClick={onAccount}>
            <span><strong>{registered ? '恢复或切换身份' : '创建或恢复身份'}</strong><small>{registered ? '用已有的密钥在另一台设备上找回' : '不需要邮箱或密码'}</small></span><ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>

    <section className="pp-group" aria-labelledby="data-title">
      <span className="pp-group-index" aria-hidden="true">03</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="data-title">记录与数据</h3>
        <p className="pp-group-lead">本机留着什么，云端又存了什么。</p>
        <div className="pp-rows">
          <div className="pp-row">
            <div className="pp-row-main"><strong>本机记录</strong><small>只存在这个浏览器里的画像与答案。</small></div>
            <div className="pp-row-control"><span className="pp-value">{local} 份</span>
              <button className="pp-text-button is-danger" disabled={busy || !local} onClick={onClearLocal}>清空</button></div>
          </div>
          <button className="pp-entry" disabled={busy || !registered} onClick={() => run(onRefresh)}>
            <span><strong>检查云端同步</strong><small>{account.checkStatus === 'unavailable' ? '上次连接没有成功，点这里重试' : '重新读取身份、画像与分享状态'}</small></span><ChevronRight size={15} />
          </button>
          {pending && <button className="pp-entry" disabled={busy} onClick={() => run(onRetryPending)}>
            <span><strong>重试待处理操作</strong><small>继续尚未完成的云端删除或分享撤销</small></span><ChevronRight size={15} />
          </button>}
        </div>
      </div>
    </section>

    <section className="pp-group" aria-labelledby="leave-title">
      <span className="pp-group-index" aria-hidden="true">04</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="leave-title">离开</h3>
        <p className="pp-group-lead">这台设备还要不要记得你。</p>
        <div className="pp-rows">
          <div className="pp-row">
            <div className="pp-row-main"><strong>退出这台设备</strong><small>{registered
              ? '本机画像会留下，云端身份与好友都还在。用恢复密钥可以随时回来。'
              : '这个浏览器还没有创建身份，退出只是换一个新的本机身份。'}</small></div>
            <button className="pp-text-button" disabled={busy} onClick={() => { setMessage(''); setConfirmLeave('signout'); }}>退出<ChevronRight size={12} /></button>
          </div>
          <div className="pp-row">
            <div className="pp-row-main"><strong>删除这个身份</strong><small>{registered
              ? '永久删除云端画像、好友码与分享链接，无法恢复。'
              : '还没有云端身份可以删除。'}</small></div>
            <button className="pp-text-button is-danger" disabled={busy || !registered}
              onClick={() => { setMessage(''); setAcknowledged(false); setClearLocalToo(false); setConfirmLeave('delete'); }}>删除<ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
    </section>

    {confirmReset && <PersonalModal title="换一个新的好友码？" busy={busy} onClose={() => { setConfirmReset(false); setMessage(''); }}>
      <p className="pp-dialog-description">旧好友码和所有旧邀请链接会立即失效。已有好友和待处理的申请都会保留；之后邀请朋友，请分享新的好友码。</p>
      <button className="pp-primary" disabled={busy} onClick={() => run(async () => { await resetFriendCode(); setConfirmReset(false); }, '好友码已更换。')}>{busy ? '正在更换…' : '确认更换'}<ArrowRight size={14} /></button>
      {message && <p className="pp-status" role="status">{message}</p>}
    </PersonalModal>}
    {confirmLeave === 'signout' && <PersonalModal title="退出这台设备？" busy={busy} onClose={() => { setConfirmLeave(null); setMessage(''); }}>
      <p className="pp-dialog-description">这个浏览器会忘记当前身份。本机画像与答案留在原处，成为只属于这台设备的记录；云端身份、好友和分享链接都不受影响。</p>
      {!account.backupSavedAt && <p className="pp-dialog-note is-warning">你还没有保存恢复密钥。退出后，这个身份将无法再被找回。</p>}
      <div className="pp-dialog-actions">
        {!account.backupSavedAt && <button className="pp-outline" disabled={busy} onClick={() => { setConfirmLeave(null); onBackup(); }}>先保存恢复密钥</button>}
        <button className="pp-primary" disabled={busy} onClick={() => run(onSignOut, '已退出这个身份。')}>{busy ? '正在退出…' : '确认退出'}<ArrowRight size={14} /></button>
      </div>
      {message && <p className="pp-status" role="status">{message}</p>}
    </PersonalModal>}

    {confirmLeave === 'delete' && <PersonalModal title="删除这个身份？" busy={busy} onClose={() => { setConfirmLeave(null); setMessage(''); }}>
      <ul className="pp-dialog-list">
        <li>云端画像与原始答案会被删除，无法恢复。</li>
        <li>所有分享链接立即失效，好友码停止使用。</li>
        <li>好友列表里会显示「已注销」，30 天后自动移除。</li>
        <li>恢复密钥随之失效，没有撤销这一步。</li>
      </ul>
      <label className="pp-check"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />我明白这个操作无法撤销。</label>
      <label className="pp-check"><input type="checkbox" checked={clearLocalToo} onChange={(event) => setClearLocalToo(event.target.checked)} />同时清除这台设备上的画像与答案（默认保留）</label>
      <div className="pp-dialog-actions">
        <button className="pp-outline is-danger" disabled={busy || !acknowledged}
          onClick={() => run(() => onDeleteIdentity({ clearLocal: clearLocalToo }), '身份已删除。')}>{busy ? '正在删除…' : '确认删除这个身份'}</button>
      </div>
      {message && <p className="pp-status" role="status">{message}</p>}
    </PersonalModal>}
  </section>;
}
