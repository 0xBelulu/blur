import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const TOKEN_KEY = 'blur.admin.token';
const SERIES = [
  { key: 'test_completed', label: '完成测试', hint: '匿名计数' },
  { key: 'accounts', label: '新增身份', hint: '云端身份' },
];

function readToken() {
  try { return window.sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

function writeToken(token) {
  try { window.sessionStorage.setItem(TOKEN_KEY, token); } catch { /* A reload then asks again. */ }
}

function format(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function Stat({ label, value, note, wide = false }) {
  return <div className={`rounded-2xl border border-blur-border bg-white/55 p-5 ${wide ? 'sm:col-span-2' : ''}`}>
    <p className="text-xs text-blur-text-muted">{label}</p>
    <p className="mt-2 text-3xl font-medium tabular-nums tracking-tight text-blur-text">{format(value)}</p>
    {note && <p className="mt-2 text-[11px] leading-relaxed text-blur-text-light">{note}</p>}
  </div>;
}

function DailyBars({ daily, series }) {
  const max = Math.max(1, ...daily.map((day) => day[series]));
  return <div>
    <div className="flex h-32 items-end gap-[3px]" role="img" aria-label={`近 ${daily.length} 天每日${series === 'accounts' ? '新增身份' : '完成测试'}数量`}>
      {daily.map((day) => <div key={day.day} className="group relative flex-1" title={`${day.day} · ${format(day[series])}`}>
        <div className="w-full rounded-t-[2px] bg-blur-accent/45 transition-colors group-hover:bg-blur-accent/80"
          style={{ height: `${Math.max(day[series] > 0 ? 4 : 1, Math.round((day[series] / max) * 128))}px` }} />
      </div>)}
    </div>
    <div className="mt-2 flex justify-between text-[11px] text-blur-text-light">
      <span>{daily[0]?.day}</span>
      <span>{daily[daily.length - 1]?.day} · UTC</span>
    </div>
  </div>;
}

export default function Admin({ onBack }) {
  const [token, setToken] = useState(readToken);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [series, setSeries] = useState('test_completed');

  const load = useCallback(async (value) => {
    if (!value) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/stats?days=30', {
        headers: { Authorization: `Bearer ${value}` }, cache: 'no-store',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.message || '无法读取统计数据');
      setStats(data);
      writeToken(value);
    } catch (problem) {
      setStats(null);
      setError(problem.message);
    } finally { setBusy(false); }
  }, []);

  // Deferred so the token gate can paint before the request starts.
  useEffect(() => {
    const saved = readToken();
    if (!saved) return undefined;
    const timer = setTimeout(() => load(saved), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!stats) {
    return <section className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs tracking-[0.2em] text-blur-text-light">BLUR · 内部</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight text-blur-text">后台访问</h1>
      <p className="mt-2 text-sm leading-relaxed text-blur-text-muted">
        这里只显示聚合数量，不含答案、画像内容与好友关系。令牌只保存在当前标签页。
      </p>
      <form className="mt-8 space-y-3" onSubmit={(event) => { event.preventDefault(); load(token.trim()); }}>
        <label className="block text-xs text-blur-text-muted" htmlFor="admin-token">访问令牌</label>
        <input id="admin-token" type="password" autoComplete="off" value={token}
          onChange={(event) => setToken(event.target.value)} placeholder="ADMIN_TOKEN"
          className="w-full rounded-xl border border-blur-border bg-white/60 px-4 py-3 text-sm text-blur-text outline-none transition-colors placeholder:text-blur-text-light focus:border-blur-accent/60" />
        <button type="submit" disabled={busy || !token.trim()}
          className="w-full rounded-xl border border-blur-border bg-white/70 px-4 py-3 text-sm font-medium text-blur-text transition-colors hover:bg-white disabled:opacity-40">
          {busy ? '正在读取…' : '进入'}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-blur-accent-rose" role="status">{error}</p>}
      <button className="mt-8 self-start text-xs text-blur-text-muted hover:text-blur-text" onClick={onBack}>返回首页</button>
    </section>;
  }

  const { cloud, events, daily } = stats;
  const started = events.test_started;
  const finished = events.test_completed;
  const rate = started > 0 ? Math.min(100, Math.round((finished / started) * 100)) : null;
  const active = SERIES.find((item) => item.key === series);

  return <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <button className="flex items-center gap-1.5 text-xs text-blur-text-muted transition-colors hover:text-blur-text" onClick={onBack}>
          <ArrowLeft size={13} /> 返回首页
        </button>
        <h1 className="mt-4 text-2xl font-medium tracking-tight text-blur-text">流量与规模</h1>
        <p className="mt-1.5 text-sm text-blur-text-muted">近 {stats.rangeDays} 天 · 只读 · 规模统计更新于 {new Date(stats.generatedAt).toLocaleTimeString('zh-CN')}{stats.cached ? '（缓存）' : ''}</p>
      </div>
      <button className="flex items-center gap-1.5 rounded-xl border border-blur-border bg-white/60 px-3 py-2 text-xs text-blur-text transition-colors hover:bg-white disabled:opacity-40"
        disabled={busy} onClick={() => load(token.trim())}>
        <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> {busy ? '刷新中' : '刷新'}
      </button>
    </header>

    {error && <p className="mt-4 text-sm text-blur-accent-rose" role="status">{error}</p>}

    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="完成测试" value={finished} note="匿名计数，含未注册访客" />
      <Stat label="开始测试" value={started} note={rate === null ? '暂无样本' : `完成率 ${rate}%`} />
      <Stat label="现存身份" value={cloud.accounts} note={`本期新增 ${format(cloud.newAccounts)}`} />
      <Stat label="分享中画像" value={cloud.liveShares} note={`云端画像 ${format(cloud.profiles)} 份`} />
    </div>

    <section className="mt-3 rounded-2xl border border-blur-border bg-white/55 p-5" aria-labelledby="trend-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="trend-title" className="text-sm font-medium text-blur-text">{active.label}趋势</h2>
          <p className="mt-0.5 text-[11px] text-blur-text-light">{active.hint} · 近 {stats.rangeDays} 天共 {format(daily.reduce((sum, day) => sum + day[series], 0))}</p>
        </div>
        <div className="flex rounded-lg border border-blur-border p-0.5" role="tablist" aria-label="切换指标">
          {SERIES.map((item) => <button key={item.key} role="tab" aria-selected={series === item.key}
            onClick={() => setSeries(item.key)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${series === item.key ? 'bg-white text-blur-text shadow-sm' : 'text-blur-text-muted hover:text-blur-text'}`}>
            {item.label}
          </button>)}
        </div>
      </div>
      <div className="mt-5"><DailyBars daily={daily} series={series} /></div>
    </section>

    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <section className="rounded-2xl border border-blur-border bg-white/55 p-5" aria-labelledby="cloud-title">
        <h2 id="cloud-title" className="text-sm font-medium text-blur-text">云端规模</h2>
        <dl className="mt-3 divide-y divide-blur-border/60 text-sm">
          {[['现存身份', cloud.accounts], ['设置展示画像', cloud.accountsWithPortrait], ['云端画像', cloud.profiles],
            ['好友关系', cloud.friendships], ['已接受', cloud.acceptedFriendships],
            ['已注销墓碑', cloud.tombstonedAccounts], ['待清理的幽灵身份', cloud.ghostCandidates],
            ['无主画像', cloud.unownedProfiles]].map(([label, value]) =>
            <div key={label} className="flex items-baseline justify-between py-2.5">
              <dt className="text-blur-text-muted">{label}</dt>
              <dd className="tabular-nums text-blur-text">{format(value)}</dd>
            </div>)}
        </dl>
      </section>
      <section className="rounded-2xl border border-blur-border bg-white/55 p-5" aria-labelledby="active-title">
        <h2 id="active-title" className="text-sm font-medium text-blur-text">活跃</h2>
        <dl className="mt-3 divide-y divide-blur-border/60 text-sm">
          {[['近 7 天活跃身份', cloud.accountsSeen7d], ['近 30 天活跃身份', cloud.accountsSeen30d]].map(([label, value]) =>
            <div key={label} className="flex items-baseline justify-between py-2.5">
              <dt className="text-blur-text-muted">{label}</dt>
              <dd className="tabular-nums text-blur-text">{format(value)}</dd>
            </div>)}
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-blur-text-light">
          {cloud.lastSeenSince
            ? `活跃自 ${new Date(cloud.lastSeenSince).toLocaleDateString('zh-CN')} 起记录，此前身份不计入。`
            : '活跃统计从本次发布后开始，此前身份不计入。'}
        </p>
      </section>
    </div>

    <section className="mt-3 rounded-2xl border border-blur-border bg-white/55 p-5" aria-labelledby="version-title">
      <h2 id="version-title" className="text-sm font-medium text-blur-text">画像版本分布</h2>
      <p className="mt-0.5 text-[11px] text-blur-text-light">用于判断迁移影响面，不含任何身份信息。</p>
      {stats.versions.length ? <table className="mt-3 w-full text-sm">
        <thead><tr className="text-left text-[11px] text-blur-text-light">
          <th className="pb-2 font-normal">题库版本</th><th className="pb-2 font-normal">评分版本</th><th className="pb-2 text-right font-normal">画像数</th>
        </tr></thead>
        <tbody className="divide-y divide-blur-border/60">
          {stats.versions.map((row) => <tr key={`${row.questionVersion}/${row.engineVersion}`}>
            <td className="py-2.5 font-mono text-xs text-blur-text">{row.questionVersion}</td>
            <td className="py-2.5 font-mono text-xs text-blur-text">{row.engineVersion}</td>
            <td className="py-2.5 text-right tabular-nums text-blur-text">{format(row.n)}</td>
          </tr>)}
        </tbody>
      </table> : <p className="mt-3 text-sm text-blur-text-muted">还没有云端画像。</p>}
    </section>

    <p className="mt-5 text-[11px] leading-relaxed text-blur-text-light">
      口径说明：完成测试来自匿名计数器，覆盖所有访客；身份只在用户使用云端功能后产生，因此小于真实参与人数。
      现存身份不含已注销的墓碑；待清理的幽灵身份指从未留下画像或好友、且已超过保留期的行。
      后台不读取答案、画像正文、好友关系与凭证，单用户信息不在此页展示。
      规模数字每 5 分钟最多重算一次，趋势与新增数据每次实时读取。
    </p>
  </section>;
}
