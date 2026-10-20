import { useEffect, useState } from 'react';
import { ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { PersonalModal, PortraitMark } from '../components/PersonalElements';
import FriendFinder from '../components/FriendFinder';
import { readPeople, friendAction, friendCode, inviteUrl } from '../utils/people';

export default function Friends({ account, onCreate, onFriend, onBackup, onSettings }) {
  const [connections, setConnections] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!account.registered) return;
    const controller = new AbortController();
    readPeople('/friends', AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]))
      .then((data) => { if (!controller.signal.aborted) { setConnections(data.connections); setError(''); } })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [account.id, account.registered, revision]);
  const reload = () => setRevision((v) => v + 1);
  const run = async (action) => {
    setBusy(true); setMessage('');
    try { await action(); }
    catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };
  const mutate = (c, accept = false) => run(async () => {
    await friendAction(`/friends/${c.id}${accept ? '/accept' : ''}`, accept ? 'POST' : 'DELETE');
    setModal(null); reload();
  });
  const copy = (text, done) => run(async () => { await navigator.clipboard.writeText(text); setMessage(done); });
  if (!account.registered) return <section className="pp-empty">
    <PortraitMark /><h2>把朋友留在这里。</h2><p>把身份存到云端，拿到自己的好友码。无需邮箱或密码。</p>
    <button className="pp-primary" onClick={onCreate}>把身份存到云端<ArrowRight size={16} /></button>
  </section>;
  const friends = (connections || []).filter((c) => c.status === 'accepted');
  const pending = (connections || []).filter((c) => c.status === 'pending');
  const code = friendCode(account.friendCode);
  return <section className="pp-friends">
    <div className="pp-section-head"><div><h2>好友</h2><p>下次再来，还能找到彼此。</p></div></div>

    <section className="pp-group" aria-labelledby="invite-title">
      <span className="pp-group-index" aria-hidden="true">01</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="invite-title">邀请朋友</h3>
        <p className="pp-group-lead">把这串好友码发给 ta，ta 就能找到你。</p>
        <div className="pp-rows">
          <div className="pp-invite-row">
            <div className="pp-invite-main">
              <p className="pp-invite-code">{code || '核实身份后显示'}</p>
              <p className="pp-invite-note">{account.requireFriendApproval ? '朋友添加你后，需要你确认。' : '朋友拿到好友码，就能直接添加你。'}<button className="pp-inline-link" onClick={onSettings}>更改</button></p>
            </div>
            <div className="pp-invite-actions">
              <button className="pp-outline" disabled={!account.friendCode || busy} onClick={() => copy(code, '好友码已复制，发给朋友就好。')}><Copy size={13} />复制好友码</button>
              <button className="pp-text-button" disabled={!account.friendCode || busy} onClick={() => copy(inviteUrl(account.friendCode), '邀请链接已复制。')}>复制邀请链接<ArrowRight size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="pp-group" aria-labelledby="add-title">
      <span className="pp-group-index" aria-hidden="true">02</span>
      <div className="pp-group-body">
        <h3 className="pp-group-title" id="add-title">添加朋友</h3>
        <p className="pp-group-lead">用 ta 发给你的好友码，或者整条邀请链接。</p>
        <div className="pp-rows">
          <div className="pp-invite-row is-block"><FriendFinder onChanged={reload} /></div>
        </div>
      </div>
    </section>

    {error && <p className="pp-status" role="status">{error} 当前列表尚未核实。</p>}
    {connections === null && !error && <p className="pp-helper" role="status">正在找回你们的连接…</p>}

    {pending.length > 0 && <section className="pp-friend-group">
      <div className="pp-friend-group-head"><h3>等待回应</h3><span>{pending.length}</span></div>
      {pending.map((c) => <article key={c.id} className="pp-friend" data-deleted={c.person.deleted ? 'true' : undefined}>
        <PortraitMark /><div className="pp-friend-info"><h3>{c.person.deleted ? '已注销的身份' : (c.person.nickname || '还没起名字')}</h3><p>{c.person.deleted ? '这个身份已被删除。' : c.person.bio}</p><small>{c.person.deleted ? '等待清理' : c.direction === 'incoming' ? '想和你成为好友' : '已送出申请，等待对方接受'}</small></div>
        <div className="pp-row-actions">{c.direction === 'incoming' && !c.person.deleted && <button className="pp-outline" disabled={busy} onClick={() => mutate(c, true)}>接受</button>}
          <button className="pp-text-button" disabled={busy} onClick={() => mutate(c)}>{c.direction === 'incoming' ? '暂不接受' : '取消申请'}</button></div>
      </article>)}
    </section>}

    <section className="pp-friend-group">
      <div className="pp-friend-group-head"><h3>已经是好友</h3><span>{friends.length || ''}</span>
        <button className="pp-icon-button" onClick={reload} title="刷新好友列表" aria-label="刷新好友列表"><RefreshCw size={13} /></button></div>
      {friends.map((c) => <article className="pp-friend" key={c.id} data-deleted={c.person.deleted ? 'true' : undefined}>
        <PortraitMark /><div className="pp-friend-info">
          <h3>{c.person.deleted ? <span className="pp-friend-deleted">已注销的身份</span> : <button className="pp-name-button" onClick={() => onFriend(c.person.publicId)}>{c.person.nickname || '还没起名字'}</button>}</h3>
          <p>{c.person.deleted ? '这个身份已被删除，画像与好友码都不再可用。' : (c.person.bio || '还没写介绍。')}</p>
          <small>{c.person.deleted ? '30 天后会自动移除' : `${new Date(c.acceptedAt).toLocaleDateString('zh-CN')} 成为好友`}</small>
        </div>
        {!c.person.deleted && <button className="pp-outline" onClick={() => onFriend(c.person.publicId)}>看看 ta<ArrowRight size={14} /></button>}
        <button className="pp-text-button" onClick={() => { setMessage(''); setModal(c); }}>管理</button>
      </article>)}
      {connections && !friends.length && <p className="pp-history-note">这里还空着。把上面那串好友码或邀请链接发给朋友，等一个熟悉的名字出现。</p>}
    </section>

    {!account.backupSavedAt && <p className="pp-connect-foot">换设备时，需要恢复密钥才能找回这个身份和好友。<button className="pp-inline-link" onClick={onBackup}>先保存一份</button></p>}
    {message && <p className="pp-status" role="status">{message}</p>}
    {modal && <PersonalModal title={modal.person.deleted ? '移除这段关系？' : '解除这段好友连接？'} busy={busy} onClose={() => setModal(null)}>
      <p className="pp-dialog-description">{modal.person.deleted
        ? '对方已经注销了这个身份。移除后，这条记录会从这里消失。'
        : `与 ${modal.person.nickname || '这位朋友'} 解除后，双方不能再通过好友入口读取画像。原有公开分享链接分别管理。`}</p>
      <button className="pp-outline" disabled={busy} onClick={() => mutate(modal)}>{modal.person.deleted ? '确认移除' : '确认解除'}</button>
    </PersonalModal>}
  </section>;
}
