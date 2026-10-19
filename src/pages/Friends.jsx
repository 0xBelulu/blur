import { useEffect, useState } from 'react';
import { ArrowRight, Copy, Plus, RefreshCw } from 'lucide-react';
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
  if (!account.registered) return <section className="pp-empty">
    <PortraitMark /><h2>把朋友留在这里。</h2><p>起个名字，拿到自己的好友码。无需邮箱或密码。</p>
    <button className="pp-primary" onClick={onCreate}>创建我的身份<ArrowRight size={16} /></button>
  </section>;
  const friends = (connections || []).filter((c) => c.status === 'accepted');
  const pending = (connections || []).filter((c) => c.status === 'pending');
  return <section className="pp-friends">
    <div className="pp-section-head"><div><h2>好友</h2><p>下次再来，还能找到彼此。</p></div><button className="pp-outline" onClick={() => { setMessage(''); setModal('find'); }}><Plus size={14} />添加好友</button></div>
    <div className="pp-invite-strip"><div><small>我的好友码</small><strong>{friendCode(account.friendCode) || '核实身份后显示'}</strong></div>
      <div className="pp-row-actions"><button className="pp-text-button" disabled={!account.friendCode || busy} onClick={() => run(async () => { await navigator.clipboard.writeText(friendCode(account.friendCode)); setMessage('好友码已复制'); })}><Copy size={13} />复制</button>
        <button className="pp-text-button" disabled={!account.friendCode || busy} onClick={() => run(async () => { await navigator.clipboard.writeText(inviteUrl(account.friendCode)); setMessage('邀请链接已复制，可以发给朋友了'); })}>复制邀请链接<ArrowRight size={13} /></button></div>
    </div>
    <p className="pp-helper">{account.requireFriendApproval ? '你开启了好友确认，新朋友需要你接受申请。' : '好友码就是邀请，朋友可以直接添加你。'}<button className="pp-inline-link" onClick={onSettings}>权限管理</button></p>
    {!account.backupSavedAt && <p className="pp-helper">换设备时，需要恢复密钥找回这个身份。<button className="pp-inline-link" onClick={onBackup}>先保存一份</button></p>}
    <div className="pp-row-actions"><button className="pp-text-button" onClick={reload}><RefreshCw size={12} />刷新好友</button>{error && <p className="pp-status" role="status">{error} 当前列表尚未核实。</p>}</div>
    {connections === null && !error && <p className="pp-helper" role="status">正在找回你们的连接…</p>}
    {pending.length > 0 && <div className="pp-requests"><h3>还在等一个回应</h3>{pending.map((c) => <article key={c.id} className="pp-friend">
      <PortraitMark /><div className="pp-friend-info"><h3>{c.person.nickname || '还没起名字'}</h3><p>{c.person.bio}</p><small>{c.direction === 'incoming' ? '想和你成为好友' : '已送出申请，等待对方接受'}</small></div>
      <div className="pp-row-actions">{c.direction === 'incoming' && <button className="pp-outline" disabled={busy} onClick={() => mutate(c, true)}>接受</button>}
        <button className="pp-text-button" disabled={busy} onClick={() => mutate(c)}>{c.direction === 'incoming' ? '暂不接受' : '取消申请'}</button></div>
    </article>)}</div>}
    {friends.map((c) => <article className="pp-friend" key={c.id}>
      <PortraitMark /><div className="pp-friend-info"><h3><button className="pp-name-button" onClick={() => onFriend(c.person.publicId)}>{c.person.nickname || '还没起名字'}</button></h3><p>{c.person.bio || '还没写介绍。'}</p><small>{new Date(c.acceptedAt).toLocaleDateString('zh-CN')} 成为好友</small></div>
      <button className="pp-outline" onClick={() => onFriend(c.person.publicId)}>看看 ta<ArrowRight size={14} /></button>
      <button className="pp-text-button" onClick={() => { setMessage(''); setModal(c); }}>管理</button>
    </article>)}
    {connections && !friends.length && <p className="pp-history-note">这里还空着。把好友码或邀请链接发给朋友，等一个熟悉的名字出现。</p>}
    {message && <p className="pp-status" role="status">{message}</p>}
    {modal && <PersonalModal title={modal === 'find' ? '找一位朋友' : '解除这段好友连接？'} busy={busy} onClose={() => setModal(null)}>
      {modal === 'find' ? <FriendFinder onChanged={reload} /> : <><p className="pp-dialog-description">与 {modal.person.nickname || '这位朋友'} 解除后，双方不能再通过好友入口读取画像。原有公开分享链接分别管理。</p><button className="pp-outline" disabled={busy} onClick={() => mutate(modal)}>确认解除</button></>}
      {message && <p role="status" className="pp-status">{message}</p>}
    </PersonalModal>}
  </section>;
}
