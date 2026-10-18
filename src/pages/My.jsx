import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowRight, Check, ChevronRight, Fingerprint, LockKeyhole, Pencil, Users } from 'lucide-react';
import AccountPanel from '../components/AccountPanel';
import ShareControls from '../components/ShareControls';
import RecordBadges from '../components/RecordBadges';
import { PersonalModal, PortraitField, PortraitMark } from '../components/PersonalElements';
import { recordArchetype, displayRecord } from '../utils/portraits';
import { saveProfile } from '../utils/cloud';
import { selectPortrait } from '../utils/people';
import Friends from './Friends';
import './Personal.css';

function date(record) { return new Date(record.createdAt).toLocaleDateString('zh-CN'); }

export default function My({ records = [], account = {}, notice, onBack, onOpen, onDeleteLocal, onClearLocal,
  onRefresh, onRetryPending, onStartTest, onCreateIdentity, onFriend, onTab, tab = 'profile', pendingLegacy = 0 }) {
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [choice, setChoice] = useState(null);
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const selected = displayRecord(records, account);
  const profile = recordArchetype(selected);
  const managed = records.find((r) => r.id === modal?.recordId);
  const displayed = records.filter((r) => filter === 'all' || (filter === 'local' ? r.localPresent && !r.cloudId : filter === 'cloud' ? r.cloudId : r.shareId));
  const open = (type, recordId) => {
    setMessage(''); setModal({ type, recordId });
    if (type === 'edit') { setDraftName(account.nickname || ''); setDraftBio(account.bio || ''); }
    if (type === 'choose' || type === 'visibility') { setChoice(selected?.id || null); setVisible(!!account.friendsVisible); }
  };
  const run = async (action, close = false) => {
    setBusy(true); setMessage('');
    try { await action(); if (close) setModal(null); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const settings = () => open('identity');
  return <div className="personal-space">
    <div className="pp-page">
      <header className="pp-header">
        <div className="pp-header-lead">
          <button className="pp-exit" onClick={onBack} title="返回首页" aria-label="返回首页"><ArrowLeft size={15} />返回首页</button>
          <span className="pp-brand">blur<span>一点点认识自己</span></span>
        </div>
        <button className="pp-text-button pp-backup" onClick={settings}><Fingerprint size={17} />身份与备份</button>
      </header>
      <section className="pp-identity" aria-label="个人介绍">
        <div className="pp-person-head"><PortraitMark color={profile?.color} /><div><p className="pp-eyebrow">我的空间</p><h1>{account.nickname || '还没起名字'}</h1></div></div>
        <button className="pp-text-button" onClick={() => open('edit')}><Pencil size={14} />编辑资料</button>
        <p className="pp-bio">{account.bio || '写一点关于自己的事，或先留个空白。'}</p>
      </section>
      <nav className="pp-tabs" aria-label="个人空间">
        {[['profile', '我的画像'], ['history', '过去的记录'], ['friends', '好友']].map(([key, label]) => <button key={key}
          aria-current={tab === key ? 'page' : undefined} onClick={() => onTab(key)}>{label}<i /></button>)}
      </nav>
      {notice && <p className="pp-status" role="status">{notice}</p>}
      <main>
        <div className="pp-panel" key={tab}>
          {tab === 'profile' && <>
            {selected && profile ? <>
              <section className="pp-portrait" aria-label="当前展示画像">
                <div className="pp-portrait-art">
                  <div className="pp-art-label"><span>现在，我用这份画像介绍自己</span><span className="pp-sequence">{String(records.indexOf(selected) + 1).padStart(2, '0')} — {String(records.length).padStart(2, '0')}</span></div>
                  <PortraitField key={selected.id} profile={profile} />
                  <span className="pp-art-date">{date(selected)} <i />{selected.answerCount} 题</span>
                </div>
                <div className="pp-portrait-copy" key={selected.id}>
                  <p className="pp-eyebrow">当下的画像</p><h2>{profile.title}<span>{profile.roleBadge}</span></h2>
                  <p className="pp-subtitle">{profile.subtitle}</p><p className="pp-description">{profile.roleSummary}</p>
                  <button className="pp-primary" onClick={() => onOpen(selected)}>看看完整的我 <ArrowUpRight size={17} /></button>
                  <button className="pp-text-button pp-change" onClick={() => open('choose')}>换一份展示画像 <ArrowRight size={14} /></button>
                </div>
              </section>
              <div className="pp-portrait-foot">
                <button className="pp-text-button" onClick={() => open('visibility')}>
                  {account.friendsVisible && account.portraitId ? <Users size={14} /> : <LockKeyhole size={14} />}
                  {account.friendsVisible && account.portraitId ? '好友可见' : '仅自己可见'}<ChevronRight size={12} />
                </button><span>新记录会留下来，展示哪一份由你决定。</span>
              </div>
            </> : <section className="pp-empty">
              <PortraitMark /><h2>{records.length ? '现在，想用哪一份介绍自己？' : '从一次随手的选择开始。'}</h2>
              <p>{records.length ? '记录都在，展示画像由你自己挑选。' : '不用先注册。完成测试后，画像会留在这个浏览器里。'}</p>
              <button className="pp-primary" onClick={records.length ? () => open('choose') : onStartTest}>{records.length ? '选择展示画像' : '开始认识自己'}<ArrowRight size={16} /></button>
            </section>}
            {records.some((r) => r.id !== selected?.id) && <section className="pp-history-peek">
              <div className="pp-section-head"><h3>也曾是这样的你</h3><button className="pp-text-button" onClick={() => onTab('history')}>全部记录<ArrowRight size={14} /></button></div>
              <div className="pp-past-grid">{records.filter((r) => r.id !== selected?.id).slice(0, 2).map((r) => <button key={r.id} className="pp-past" onClick={() => onOpen(r)}>
                <span className="pp-past-symbol" style={{ '--ink': (recordArchetype(r)?.color || [180, 185, 195]).join(',') }}>{recordArchetype(r)?.symbol || '◌'}</span>
                <span><strong>{recordArchetype(r)?.title || '画像'}</strong><small>{date(r)} · {r.answerCount} 题</small></span><ArrowUpRight size={16} />
              </button>)}</div>
            </section>}
            <footer className="pp-page-footer"><p>人会变化，每一次都算数。</p><button className="pp-text-button" onClick={onStartTest}>再认识自己一次<ArrowRight size={14} /></button></footer>
          </>}
          {tab === 'history' && <section className="pp-history">
            <div className="pp-section-head"><div><h2>过去的记录</h2><p>每一份，都是当时的自己。</p></div><button className="pp-text-button" disabled={busy} onClick={() => run(onRefresh)}>核实云端状态</button></div>
            <div className="pp-filters" role="group" aria-label="筛选记录">{[['all', '全部'], ['local', '仅本机'], ['cloud', '云端'], ['shared', '公开']].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
            {displayed.map((r) => <article key={r.id} className="pp-record">
              <span className="pp-record-date">{date(r)}</span><span className="pp-past-symbol" style={{ '--ink': (recordArchetype(r)?.color || [180, 185, 195]).join(',') }}>{recordArchetype(r)?.symbol || '◌'}</span>
              <div className="pp-record-info"><h3>{recordArchetype(r)?.title || '画像'}{selected?.id === r.id && <small>正在展示</small>}</h3><p>{r.answerCount} 题</p><RecordBadges record={r} /></div>
              <div className="pp-row-actions"><button className="pp-text-button" onClick={() => onOpen(r)}>回看<ArrowUpRight size={13} /></button><button className="pp-text-button" onClick={() => open('record', r.id)}>管理</button></div>
            </article>)}
            {!displayed.length && <p className="pp-history-note">这里还没有记录。{!records.length ? '完成一次测试，就会留下第一份。' : '换个筛选看看。'}</p>}
            <p className="pp-history-note">本机记录不会自动上传。同步、分享和删除，可以在每份记录的「管理」中操作。</p>
            <div className="pp-row-actions"><button className="pp-outline" onClick={onStartTest}>再测一次<ArrowRight size={14} /></button>
              {(pendingLegacy > 0 || records.some((r) => r.pendingAction)) && <button className="pp-text-button" disabled={busy} onClick={() => run(onRetryPending)}>重试待处理操作</button>}
              {records.some((r) => r.localPresent) && <button className="pp-text-button" onClick={() => open('clear')}>清空本机记录</button>}</div>
          </section>}
          {tab === 'friends' && <Friends key={account.id || 'guest'} account={account} onCreate={onCreateIdentity} onFriend={onFriend} onBackup={settings} />}
        </div>
      </main>
      {message && !modal && <p className="pp-status" role="status">{message}</p>}
      {modal && <PersonalModal title={({ edit: '写一点关于你', identity: '身份与备份', choose: '哪一份更像现在的你？', visibility: '谁可以看到这份画像', record: '这一次的记录', clear: '清空本机记录？' })[modal.type]} onClose={() => setModal(null)} busy={busy}>
        {modal.type === 'edit' && <form onSubmit={(e) => { e.preventDefault(); run(() => saveProfile({ nickname: draftName, bio: draftBio }), true); }}>
          <label>展示名字<input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={24} required /></label>
          <label>关于我<textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} maxLength={80} rows={3} placeholder="一句普通的话也很好。" /></label>
          <p className="pp-helper">{account.registered ? '名字和简介会随身份保存，好友可以看到。' : '先保存在这个浏览器。创建身份后，可以和朋友连接。'}</p>
          <button className="pp-primary" disabled={busy || !draftName.trim()}>{busy ? '正在保存…' : '保存资料'}<Check size={14} /></button>
        </form>}
        {(modal.type === 'choose' || modal.type === 'visibility') && <>
          {modal.type === 'choose' && <div>{records.map((r) => <button key={r.id} className="pp-choose" aria-pressed={choice === r.id} disabled={busy} onClick={() => setChoice(r.id)}>
            <span>{recordArchetype(r)?.symbol || '◌'}</span><div><strong>{recordArchetype(r)?.title || '画像'}</strong><small>{date(r)} · {r.answerCount} 题</small></div>{choice === r.id && <Check size={16} />}
          </button>)}</div>}
          {account.registered ? <>
            <label className="pp-check"><input type="checkbox" checked={visible} disabled={busy} onChange={(e) => setVisible(e.target.checked)} />允许已接受的好友查看这份完整画像</label>
            <p className="pp-helper">保存会将选中的这一份记录同步到云端。好友可以看到画像内容，原始答案和其他记录保持私密。已有公开链接单独管理。</p>
          </> : <p className="pp-helper">这次选择仅保存在本机。创建身份后，可以选择将画像展示给好友。</p>}
          <button className="pp-primary" disabled={busy || !choice} onClick={() => run(() => selectPortrait(records.find((r) => r.id === choice), visible), true)}>{busy ? '正在保存…' : '就用这一份'}<Check size={14} /></button>
          {!account.registered && <button className="pp-text-button pp-spaced" onClick={onCreateIdentity}>创建身份<ArrowRight size={14} /></button>}
        </>}
        {modal.type === 'identity' && <AccountPanel key={account.id || 'guest'} account={account} onCreate={onCreateIdentity} />}
        {modal.type === 'record' && (managed ? <>
          <p className="pp-dialog-description">{date(managed)} · {managed.answerCount} 题 · {recordArchetype(managed)?.title}</p>
          <ShareControls record={managed} />
          {managed.localPresent && <details className="pp-danger"><summary>删除这份本机记录</summary><p>云端副本和公开链接保持原有状态。</p><button className="pp-outline" onClick={() => { onDeleteLocal(managed.id); setModal(null); }}>确认删除本机记录</button></details>}
        </> : <p className="pp-helper">这份记录已移除。</p>)}
        {modal.type === 'clear' && <><p className="pp-dialog-description">仅清除这个浏览器保存的画像与答案，云端副本和公开链接不变。本机独有的记录将无法找回。</p><button className="pp-outline" onClick={() => { onClearLocal(); setModal(null); }}>确认清空本机记录</button></>}
        {message && <p className="pp-status" role="status">{message}</p>}
      </PersonalModal>}
    </div>
  </div>;
}
