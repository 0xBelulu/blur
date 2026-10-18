import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import Result from './Result';
import Comparison from './Comparison';
import { api } from '../utils/cloud';
import { canCompare } from '../../shared/profile';

export default function SharedProfile({ shareId, mode, records, cached, selectedRecordId, onLoaded, onHome, onCompare, onView, onStart }) {
  const [profile, setProfile] = useState(cached);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(selectedRecordId || null);
  const loadedCallback = useRef(onLoaded);
  const initialProfile = useRef(cached);
  useEffect(() => { loadedCallback.current = onLoaded; }, [onLoaded]);

  useEffect(() => {
    if (initialProfile.current && mode === 'compare' && retry === 0) return;
    const controller = new AbortController();
    api(`/shares/${shareId}`, { publicAccess: true, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then((data) => { setProfile(data); setError(''); loadedCallback.current(data); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [shareId, mode, retry]);

  if (error || !profile) return <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-5">
    <h1 className="text-xl">查看性格画像</h1>
    <p role="status" className="text-sm text-blur-text-muted">{error || '正在读取这份画像…'}</p>
    {error && <GlassButton onClick={() => setRetry((value) => value + 1)}>重新读取</GlassButton>}
    <GlassButton variant="ghost" onClick={onHome}>返回主页，体验测试</GlassButton>
  </div>;

  const mine = records.find((record) => record.id === selectedId);
  if (mode === 'compare' && mine && canCompare(mine, profile)) {
    return <Comparison mine={mine} theirs={profile} onBack={() => setSelectedId(null)} />;
  }

  if (mode === 'compare') return <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
    <button onClick={onView} className="flex items-center gap-2 text-sm text-blur-text-muted cursor-pointer"><ArrowLeft size={16} />返回 ta 的画像</button>
    <div><p className="text-[10px] tracking-[0.25em] text-blur-text-light">BLUR TOGETHER</p>
      <h1 className="text-xl mt-2">选择哪一次的你，与 {profile.nickname || 'ta'} 对比？</h1>
      <p className="text-xs text-blur-text-muted mt-3 leading-relaxed">对比不会开启你的分享，也不会把原始答案发送给对方。</p></div>
    <div className="space-y-3">
      {records.map((record) => {
        const compatible = canCompare(record, profile);
        return <button key={record.id} disabled={!compatible} onClick={() => setSelectedId(record.id)}
          className="glass rounded-2xl p-4 w-full text-left disabled:opacity-50 enabled:cursor-pointer enabled:hover:bg-white/60">
          <span className="text-xl mr-3">{record.result.archetype.symbol}</span>{record.result.archetype.title}
          <span className="block text-xs text-blur-text-muted mt-2">{new Date(record.createdAt).toLocaleString('zh-CN')}
            {!compatible && ' · 版本不同，暂不能直接对比'}</span>
        </button>;
      })}
      {!records.length && <p className="text-sm text-blur-text-muted">还没有自己的画像，先完成一次测试。</p>}
    </div>
    <GlassButton onClick={onStart}>测一次新的画像，再来对比</GlassButton>
  </div>;

  return <>
    <header className="max-w-5xl mx-auto px-6 pt-8 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] tracking-[0.25em] text-blur-text-light">BLUR PORTRAIT</p>
        <h1 className="text-lg mt-1">{profile.nickname ? `${profile.nickname} 的性格画像` : '查看我的性格'}</h1>
        <p className="text-xs text-blur-text-muted mt-1">{new Date(profile.createdAt).toLocaleDateString('zh-CN')} · 本次测试的公开快照</p></div>
      <GlassButton onClick={onCompare}>和 ta 对比</GlassButton>
    </header>
    <Result result={profile.result} publicView onRestart={onHome} onCompare={onCompare} />
  </>;
}
