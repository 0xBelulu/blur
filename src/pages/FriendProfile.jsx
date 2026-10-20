import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { PortraitField, PortraitMark } from '../components/PersonalElements';
import { readPeople } from '../utils/people';
import { canCompare } from '../../shared/profile';
import Comparison from './Comparison';
import Result from './Result';
import './Personal.css';

export default function FriendProfile({ publicId, account, mode, onBack, onCreate, onCompare, onView, onMy }) {
  const [snapshot, setData] = useState(null);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [full, setFull] = useState(false);
  const verification = [publicId, account.id, account.portraitId, account.friendsVisible, mode, revision].join('/');
  const data = snapshot?.key === verification ? snapshot.value : null;
  useEffect(() => {
    if (!account.registered) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
    const load = async () => {
      // Never reuse the public-link cache for friend authorization.
      const friend = await readPeople(`/friends/${publicId}/profile`, signal);
      let own = null;
      if (mode === 'together' && friend.portrait) {
        const current = await readPeople('/account', signal);
        if (current.portraitId && current.friendsVisible) own = await readPeople(`/records/${current.portraitId}`, signal);
      }
      if (!controller.signal.aborted) { setData({ value: friend, key: verification }); setMine(own); setError(''); }
    };
    load().catch((e) => { if (!controller.signal.aborted) { setData(null); setMine(null); setError(e.message); } });
    const revalidate = () => { if (!document.hidden) setRevision((v) => v + 1); };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => { controller.abort(); window.removeEventListener('focus', revalidate); document.removeEventListener('visibilitychange', revalidate); };
  }, [publicId, account.registered, mode, verification]);
  if (mode === 'together' && data?.portrait && mine && canCompare(mine, data.portrait)) {
    return <Comparison mine={mine} theirs={data.portrait} onBack={onView} friendView />;
  }
  const portrait = data?.portrait;
  const profile = portrait?.result.archetype;
  return <div className="personal-space"><div className="pp-page">
    <header className="pp-header"><button className="pp-text-button" onClick={onBack}><ArrowLeft size={16} />我的好友</button><span className="pp-brand">blur</span></header>
    {!account.registered ? <section className="pp-empty"><h1>先找回你自己的名字。</h1><p>把身份存到云端，或恢复已有身份，才能读取好友画像。</p><button className="pp-primary" onClick={onCreate}>存到云端或恢复身份<ArrowRight size={15} /></button></section>
      : error || !data ? <section className="pp-empty"><h1>{error ? (error.includes('注销') ? '这个身份已经注销。' : '暂时没能读到这份画像。') : '正在找回你们的连接…'}</h1><p role="status">{error}</p>{error && !error.includes('注销') && <button className="pp-outline" onClick={() => setRevision((v) => v + 1)}><RefreshCw size={14} />重新读取</button>}</section>
        : <>
          <section className="pp-identity"><div className="pp-person-head"><PortraitMark color={profile?.color} /><div><p className="pp-eyebrow">朋友的空间</p><h1>{data.person.nickname || '还没起名字'}</h1></div></div><p className="pp-bio">{data.person.bio || '还没写介绍。'}</p></section>
          {mode === 'together' && <section className="pp-notice"><p>{!portrait ? '朋友还没有展示画像，晚点再来看看。' : !mine ? '先选择一份你愿意展示给好友的画像，再一起看看。' : '这两份画像的评分或题库版本不同，暂时不能直接对比。'}</p><button className="pp-outline" onClick={!mine ? onMy : onView}>{!mine ? '选择我的展示画像' : '回到朋友的空间'}<ArrowRight size={14} /></button></section>}
          {portrait && profile ? <>
            <section className="pp-portrait"><div className="pp-portrait-art"><div className="pp-art-label"><span>ta 现在用这份画像介绍自己</span></div><PortraitField profile={profile} /><span className="pp-art-date">{new Date(portrait.createdAt).toLocaleDateString('zh-CN')}<i />{portrait.answerCount} 题</span></div>
              <div className="pp-portrait-copy"><p className="pp-eyebrow">当下的画像</p><h2>{profile.title}<span>{profile.roleBadge}</span></h2><p className="pp-subtitle">{profile.subtitle}</p><p className="pp-description">{profile.roleSummary}</p><button className="pp-primary" onClick={onCompare}>看看我们有什么不同<ArrowRight size={15} /></button><button className="pp-text-button pp-change" onClick={() => setFull(!full)}>{full ? '收起完整画像' : '读读 ta 的画像'}</button></div>
            </section>{full && <Result result={portrait.result} publicView onRestart={onBack} onCompare={onCompare} />}
          </> : <section className="pp-empty"><PortraitMark /><h2>这里先留个空白。</h2><p>朋友还没有展示画像，或者暂时收起了它。你们的连接仍然在。</p></section>}
        </>}
  </div></div>;
}
