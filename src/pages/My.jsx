import { useState } from 'react';
import { ArrowLeft, ChevronRight, Cloud, HardDrive, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import AccountPanel from '../components/AccountPanel';
import RecordBadges from '../components/RecordBadges';
import ShareControls from '../components/ShareControls';

const FILTERS = [
  { key: 'all', label: '全部' }, { key: 'local', label: '仅本机' },
  { key: 'cloud', label: '云端副本' }, { key: 'shared', label: '分享中' },
];

export default function My({ records, account, onBack, onOpen, onDeleteLocal, onClearLocal, onRefresh, notice, pendingLegacy = 0, onRetryPending }) {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const localCount = records.filter((record) => record.localPresent).length;
  const cloudCount = records.filter((record) => record.cloudId).length;
  const sharedCount = records.filter((record) => record.shareId).length;
  const visible = records.filter((record) => filter === 'all' ||
    (filter === 'local' && record.localPresent && !record.cloudId) ||
    (filter === 'cloud' && record.cloudId) || (filter === 'shared' && record.shareId));

  return <div className="min-h-[100svh] px-5 py-8 md:py-12">
    <div className="max-w-3xl mx-auto space-y-7">
      <header className="flex items-center justify-between">
        <button onClick={onBack} aria-label="返回主页" className="glass rounded-full p-3 cursor-pointer"><ArrowLeft size={18} /></button>
        <div className="text-center"><p className="text-[10px] tracking-[0.28em] text-blur-text-light">MY BLUR</p><h1 className="text-2xl mt-1">我的</h1></div>
        <span className="w-11" aria-hidden="true" />
      </header>
      <AccountPanel key={account.id || 'guest'} account={account} />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-medium">我的画像</h2>
            <p className="text-xs text-blur-text-muted mt-1">本机 {localCount} 份 · 已知云端副本 {cloudCount} 份，其中分享中 {sharedCount} 份</p></div>
          <button disabled={refreshing} className="flex items-center gap-1.5 text-xs text-blur-text-muted cursor-pointer disabled:opacity-50" onClick={async () => {
            setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); }
          }}><RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />{refreshing ? '正在核实' : '核实云端状态'}</button>
        </div>
        <p className="text-[11px] text-blur-text-muted leading-relaxed">
          {account.checkStatus === 'unavailable' ? '暂时无法核实云端状态。下方保留上次记录，不代表服务器上的最新状态。' :
            account.registered ? (account.lastVerifiedAt ? `上次核实：${new Date(account.lastVerifiedAt).toLocaleString('zh-CN')}` : '云端状态尚未核实') : '没有主动同步的画像，不会上传到服务器。'}
        </p>
        {notice && <p role="status" className="glass rounded-2xl p-4 text-xs text-blur-text-muted leading-relaxed">{notice}</p>}
        {pendingLegacy > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800">
          <p>旧版本有 {pendingLegacy} 条云端删除尚未确认，原链接可能仍可访问。</p>
          <button onClick={onRetryPending} className="underline mt-2 cursor-pointer">重试这些已请求的云端操作</button>
        </div>}
        <div className="flex flex-wrap gap-2" role="group" aria-label="画像筛选">
          {FILTERS.map((item) => <button key={item.key} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}
            className={`px-3.5 py-2 rounded-xl text-xs cursor-pointer border ${filter === item.key ? 'glass-strong text-blur-text border-blur-accent/30' : 'bg-white/20 border-transparent text-blur-text-muted'}`}>{item.label}</button>)}
        </div>
        <div className="space-y-3">
          {visible.map((record) => <article key={record.id} className="glass rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="glass-strong rounded-2xl w-12 h-12 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">{record.preview?.symbol || record.result?.archetype?.symbol || '◌'}</span>
              <div className="flex-1 min-w-0">
                <button onClick={() => onOpen(record)} className="flex items-center gap-2 cursor-pointer text-left">
                  <span className="text-base font-medium">{record.preview?.title || record.result?.archetype?.title || '未命名画像'}</span><ChevronRight size={14} className="text-blur-text-light" />
                </button>
                <p className="text-[11px] text-blur-text-muted mt-1 mb-3">{new Date(record.createdAt).toLocaleString('zh-CN')} · {record.answerCount || Object.keys(record.answers || {}).length} 题</p>
                <RecordBadges record={record} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <button onClick={() => onOpen(record)} className="inline-flex items-center gap-1.5 text-blur-text-muted cursor-pointer">
                {record.localPresent ? <HardDrive size={13} /> : <Cloud size={13} />}{record.localPresent ? '查看画像' : '下载到本机并查看'}
              </button>
              <button aria-expanded={expandedId === record.id} onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="inline-flex items-center gap-1.5 text-blur-accent cursor-pointer"><Settings2 size={13} />同步与分享</button>
              {record.localPresent && <button onClick={() => setDeletingId(deletingId === record.id ? null : record.id)}
                className="inline-flex items-center gap-1.5 text-blur-text-muted cursor-pointer"><Trash2 size={13} />删除本机</button>}
            </div>
            {deletingId === record.id && <div className="border-t border-blur-border pt-3 text-xs space-y-3">
              <p className="text-blur-text-muted">{record.cloudId ? '只删除这台设备上的完整画像，云端副本及分享链接保留。' : '这份画像仅在本机，删除后无法找回。'}</p>
              <div className="flex gap-4"><button className="text-blur-accent cursor-pointer" onClick={() => { onDeleteLocal(record.id); setDeletingId(null); }}>确认删除本机</button>
                <button className="text-blur-text-muted cursor-pointer" onClick={() => setDeletingId(null)}>取消</button></div>
            </div>}
            {expandedId === record.id && <div className="pt-4 border-t border-blur-border"><ShareControls record={record} /></div>}
          </article>)}
          {!visible.length && <div className="glass rounded-2xl py-10 px-5 text-center text-sm text-blur-text-muted">{records.length ? '这个分类下还没有画像' : '完成一次测试后，画像会先留在本机。'}</div>}
        </div>
        {localCount > 0 && <div className="pt-3 text-xs text-blur-text-muted">
          {!confirmClear ? <button onClick={() => setConfirmClear(true)} className="cursor-pointer underline">清空本机画像</button> : <div className="space-y-3">
            <p>仅本机的画像将无法找回。云端副本和分享链接不受影响。</p>
            <div className="flex gap-4"><button className="text-blur-accent cursor-pointer" onClick={() => { onClearLocal(); setConfirmClear(false); }}>确认清空本机</button>
              <button className="cursor-pointer" onClick={() => setConfirmClear(false)}>取消</button></div>
          </div>}
        </div>}
      </section>
    </div>
  </div>;
}
