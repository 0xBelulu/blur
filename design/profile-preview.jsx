import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, Check, ChevronRight, Clock3, Fingerprint, LockKeyhole, Pencil, Plus, Users, X } from 'lucide-react';
import AtmosphereField from '../src/components/AtmosphereField';
import { ARCHETYPE_PROFILES } from '../src/data/archetypeProfiles';
import '../src/index.css';
import './profile-preview.css';

// Isolated design fixtures. This entry never reads or writes the user's identity,
// portraits or friends, and is not included in the production Vite entry.
const RECORDS = [
  { id: 'oct18', key: 'mist', date: '10 月 18 日', fullDate: '2026.10.18', count: 24, note: '周日下午，慢慢做完的。' },
  { id: 'oct05', key: 'chime', date: '10 月 5 日', fullDate: '2026.10.05', count: 18, note: '那天好像什么都能听见。' },
  { id: 'sep24', key: 'warmCurrent', date: '9 月 24 日', fullDate: '2026.09.24', count: 10, note: '第一次来，随手试了试。' },
];
const FRIENDS = [
  { name: '小满', key: 'warmCurrent', bio: '今天也想出去走走。', since: '10 月 12 日成为好友' },
  { name: '阿澈', key: 'crystal', bio: '大部分时候都挺好说话。', since: '10 月 8 日成为好友' },
];

function Mark({ color, className = '' }) {
  return <span className={`pp-mark ${className}`} style={{ '--ink': color.join(',') }} aria-hidden="true"><i /><i /><i /></span>;
}

function PortraitField({ profile, compact = false }) {
  return <div className={`pp-field ${compact ? 'is-compact' : ''}`} style={{ '--ink': profile.color.join(',') }} aria-hidden="true">
    <div className="pp-wash" />
    <div className="pp-orbit pp-orbit-one" /><div className="pp-orbit pp-orbit-two" />
    <div className="pp-orbit pp-orbit-three" />
    <span className="pp-field-symbol">{profile.symbol}</span>
    <span className="pp-field-cross cross-one">+</span><span className="pp-field-cross cross-two">+</span>
    <span className="pp-field-dot" />
  </div>;
}

export default function ProfilePreview() {
  const [tab, setTab] = useState('profile');
  const [selectedId, setSelectedId] = useState(RECORDS[0].id);
  const [name, setName] = useState('小林');
  const [bio, setBio] = useState('喜欢和朋友待着，也喜欢约好下次再见。');
  const [visibility, setVisibility] = useState('friends');
  const [modal, setModal] = useState(null);
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);
  const dialog = useRef(null);
  const selected = RECORDS.find((record) => record.id === selectedId);
  const profile = ARCHETYPE_PROFILES[selected.key];
  const modalRecord = modal?.record || selected;
  const modalProfile = ARCHETYPE_PROFILES[modalRecord.key];

  const open = (value) => {
    setModal(value);
    if (value.type === 'edit') { setDraftName(name); setDraftBio(bio); }
    dialog.current.showModal();
  };
  const close = () => dialog.current.close();
  const showProfile = (id) => { setSelectedId(id); setTab('profile'); close(); };

  return <div className="profile-preview">
    <AtmosphereField intensity={0.34} />
    <div className="pp-sample">交互样张 <span>·</span> 人物与记录均为示例，操作仅在本页生效</div>
    <div className="pp-page">
      <header className="pp-header">
        <a className="pp-brand" href="/" aria-label="返回当前 Blur 首页">blur<span>一点点认识自己</span></a>
        <button className="pp-text-button pp-backup" onClick={() => open({ type: 'identity' })}><Fingerprint size={17} /><span>身份与备份</span></button>
      </header>

      <section className="pp-identity" aria-label="个人介绍">
        <div className="pp-person-head"><Mark color={profile.color} /><div><p className="pp-eyebrow">我的空间</p><h1>{name}</h1></div></div>
        <button className="pp-text-button" onClick={() => open({ type: 'edit' })}><Pencil size={14} />编辑资料</button>
        <p className="pp-bio">{bio || '还没写介绍，先这样也很好。'}</p>
      </section>

      <nav className="pp-tabs" aria-label="个人空间">
        {[['profile', '我的画像'], ['history', '过去的记录'], ['friends', '好友']].map(([key, label]) => <button
          key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}>{label}<i /></button>)}
      </nav>

      <main>
        {tab === 'profile' && <div className="pp-enter">
          <section className="pp-portrait" aria-label="当前展示画像">
            <div className="pp-portrait-art">
              <div className="pp-art-label"><span>现在，我用这份画像介绍自己</span><span className="pp-sequence">{String(RECORDS.indexOf(selected) + 1).padStart(2, '0')} — {String(RECORDS.length).padStart(2, '0')}</span></div>
              <PortraitField key={selectedId} profile={profile} />
              <span className="pp-art-date">{selected.fullDate} <i /> {selected.count} 题</span>
            </div>
            <div className="pp-portrait-copy" key={selectedId}>
              <p className="pp-eyebrow">当下的画像</p>
              <h2>{profile.title}<span>{profile.roleBadge}</span></h2>
              <p className="pp-subtitle">{profile.subtitle}</p>
              <p className="pp-description">{profile.roleSummary}</p>
              <button className="pp-primary" onClick={() => open({ type: 'record', record: selected })}>看看完整的我 <ArrowUpRight size={17} /></button>
              <button className="pp-text-button pp-change" onClick={() => open({ type: 'choose' })}>换一份展示画像 <ArrowRight size={14} /></button>
            </div>
          </section>
          <div className="pp-portrait-foot">
            <button className="pp-text-button" onClick={() => open({ type: 'visibility' })}>
              {visibility === 'friends' ? <Users size={14} /> : <LockKeyhole size={14} />}
              {visibility === 'friends' ? '好友可见' : '仅自己可见'}<ChevronRight size={12} />
            </button>
            <span>新记录会留下来，展示哪一份由你决定。</span>
          </div>

          <section className="pp-history-peek">
            <div className="pp-section-head"><h3>也曾是这样的你</h3><button className="pp-text-button" onClick={() => setTab('history')}>全部记录 <ArrowRight size={14} /></button></div>
            <div className="pp-past-grid">{RECORDS.filter((record) => record.id !== selectedId).map((record) => {
              const p = ARCHETYPE_PROFILES[record.key];
              return <button key={record.id} className="pp-past" onClick={() => open({ type: 'record', record })}>
                <span className="pp-past-symbol" style={{ '--ink': p.color.join(',') }}>{p.symbol}</span>
                <span><strong>{p.title}</strong><small>{record.date} · {record.count} 题</small></span><ArrowUpRight size={16} />
              </button>;
            })}</div>
          </section>
          <footer className="pp-page-footer"><p>今天的你，可以和上次不一样。</p><a href="/">再测一次 <Plus size={15} /></a></footer>
        </div>}

        {tab === 'history' && <section className="pp-history pp-enter">
          <div className="pp-section-head"><div><h2>每一次，都留在这里。</h2><p>选一份回看，也可以用它更新自己的展示画像。</p></div><Clock3 size={20} /></div>
          {RECORDS.map((record) => {
            const p = ARCHETYPE_PROFILES[record.key];
            return <article className="pp-record" key={record.id}>
              <span className="pp-record-date">{record.date}</span><span className="pp-past-symbol" style={{ '--ink': p.color.join(',') }}>{p.symbol}</span>
              <div className="pp-record-info"><h3>{p.title}{record.id === selectedId && <small>正在展示</small>}</h3><p>{record.note}</p><span>{record.count} 题 · 示例记录</span></div>
              <button className="pp-text-button" onClick={() => open({ type: 'record', record })}>回看 <ArrowUpRight size={15} /></button>
            </article>;
          })}
          <p className="pp-history-note">记录保存那一次的你。更换展示画像，不会覆盖过去。</p>
        </section>}

        {tab === 'friends' && <section className="pp-friends pp-enter">
          <div className="pp-section-head"><div><h2>熟悉的人，也有另一面。</h2><p>从对方愿意展示的画像开始，多认识一点。</p></div><button className="pp-outline" onClick={() => open({ type: 'invite' })}><Plus size={15} />添加好友</button></div>
          {FRIENDS.map((friend) => {
            const p = ARCHETYPE_PROFILES[friend.key];
            return <article className="pp-friend" key={friend.name}>
              <Mark color={p.color} /><div className="pp-friend-info"><h3>{friend.name}<span>{p.title}</span></h3><p>{friend.bio}</p><small>{friend.since}</small></div>
              <button className="pp-outline" onClick={() => open({ type: 'compare', friend })}>和 ta 对比 <ArrowUpRight size={15} /></button>
            </article>;
          })}
          <p className="pp-history-note">这里展示的是好友界面的示例，没有读取或创建真实好友关系。</p>
        </section>}
      </main>
    </div>

    <dialog ref={dialog} className="pp-dialog" onClick={(event) => { if (event.target === event.currentTarget) close(); }} aria-labelledby="pp-dialog-title">
      <div className="pp-dialog-inner">
        <button className="pp-close" aria-label="关闭" onClick={close}><X size={20} /></button>
        {modal?.type === 'edit' && <form onSubmit={(event) => { event.preventDefault(); setName(draftName.trim()); setBio(draftBio.trim()); close(); }}>
          <p className="pp-eyebrow">由你来介绍自己</p><h2 id="pp-dialog-title">名字，和一句想说的话。</h2>
          <label>展示名字<input autoFocus required value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={24} /></label>
          <label>一句介绍<textarea value={draftBio} onChange={(event) => setDraftBio(event.target.value)} maxLength={80} rows={3} /></label>
          <p className="pp-helper">样张中的修改只保留到本页刷新。</p><button className="pp-primary" type="submit">就这样 <Check size={16} /></button>
        </form>}
        {modal?.type === 'choose' && <><p className="pp-eyebrow">每一份都属于你</p><h2 id="pp-dialog-title">现在，想展示哪一份？</h2>
          <p className="pp-dialog-description">选中的画像会出现在个人页，其他记录继续保留。</p>
          {RECORDS.map((record) => <button className="pp-choose" key={record.id} onClick={() => showProfile(record.id)}>
            <span>{ARCHETYPE_PROFILES[record.key].symbol}</span><div><strong>{ARCHETYPE_PROFILES[record.key].title}</strong><small>{record.date} · {record.count} 题</small></div>{record.id === selectedId ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>)}
        </>}
        {modal?.type === 'visibility' && <><p className="pp-eyebrow">自己决定展示的范围</p><h2 id="pp-dialog-title">谁能看到这份画像？</h2>
          {[['private', '仅自己', '先留给自己。'], ['friends', '好友', '接受好友邀请后，对方可以查看这份画像。']].map(([key, title, text]) => <button key={key} className="pp-visibility" onClick={() => { setVisibility(key); close(); }}>
            <div><strong>{title}</strong><p>{text}</p></div>{visibility === key ? <Check size={18} /> : <span className="pp-radio" />}
          </button>)}<p className="pp-helper">此处只演示好友权限。公开分享链接在实际产品中独立管理。</p>
        </>}
        {modal?.type === 'record' && <><p className="pp-eyebrow">{modalRecord.fullDate} · {modalRecord.count} 题 · 示例记录</p><h2 id="pp-dialog-title">那一次的你，像{modalProfile.title}。</h2>
          <PortraitField profile={modalProfile} compact /><p className="pp-record-reading">{modalProfile.roleSummary}</p>
          <h3 className="pp-reading-title">在关系中</h3><p className="pp-record-reading">{modalProfile.narrative.inRelation}</p>
          <button className="pp-primary" onClick={() => showProfile(modalRecord.id)}>{modalRecord.id === selectedId ? '正在用这份介绍自己' : '用这份画像介绍自己'}<Check size={16} /></button>
        </>}
        {modal?.type === 'identity' && <><p className="pp-eyebrow">身份与备份 · 界面示意</p><h2 id="pp-dialog-title">下次来，还能找到自己。</h2><p className="pp-dialog-description">正式版本会在这里提供身份凭证的保存与恢复。无需设置密码。</p><div className="pp-identity-note"><Fingerprint size={28} /><p>这份样张没有创建账号，<br />也没有读取你的身份凭证。</p></div><button className="pp-primary" onClick={close}>知道了 <Check size={16} /></button></>}
        {modal?.type === 'invite' && <><p className="pp-eyebrow">添加好友 · 界面示意</p><h2 id="pp-dialog-title">把熟悉的人带到这里。</h2><label>好友码<input placeholder="输入对方的好友码" disabled /></label><p className="pp-dialog-description">正式版本会展示对方的简要资料，由双方确认连接。样张不发送邀请。</p><button className="pp-primary" onClick={close}>返回好友 <ArrowRight size={16} /></button></>}
        {modal?.type === 'compare' && <><p className="pp-eyebrow">双人对比入口 · 界面示意</p><h2 id="pp-dialog-title">你和{modal.friend.name}</h2><div className="pp-compare-art"><Mark color={profile.color} /><span>×</span><Mark color={ARCHETYPE_PROFILES[modal.friend.key].color} /></div><p className="pp-compare-names">{profile.title} <span>与</span> {ARCHETYPE_PROFILES[modal.friend.key].title}</p><p className="pp-dialog-description">这里将直接打开双方主动展示的画像对比。详细对比继续沿用并打磨项目现有的双人页面。</p><p className="pp-helper">当前仅演示入口，不生成匹配分数或虚构对比结果。</p><button className="pp-primary" onClick={close}>回到好友 <ArrowRight size={16} /></button></>}
      </div>
    </dialog>
  </div>;
}

if (typeof document !== 'undefined') {
  const root = import.meta.hot?.data.root || createRoot(document.getElementById('root'));
  if (import.meta.hot) import.meta.hot.data.root = root;
  root.render(<ProfilePreview />);
}
