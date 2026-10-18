import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, ChevronDown, Compass, MoveUpRight, Sparkles } from 'lucide-react';
import TraitSpace2D from '../components/TraitSpace2D';
import DraggableTabs from '../components/DraggableTabs';
import CompareField from '../components/CompareField';
import { DIMENSION_PAIRS } from '../utils/blurEngine';
import { compareDimensions, tendency } from '../utils/comparison';
import './Comparison.css';

const INITIAL_DIMENSIONS = 6;
const MINE_COLOR = [151, 130, 191];
const THEIRS_COLOR = [83, 145, 163];

const signed = (value) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;

function portraitDate(record) {
  return new Date(record.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function answerCount(record) {
  return record.answerCount || Object.keys(record.answers || {}).length;
}

const prefersReducedMotion = () => typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let frame = 0;
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/* ── 双人身份 ─────────────────────────────────────────────────── */
function PortraitIdentity({ record, label, side }) {
  const { archetype } = record.result;
  return <div className={`cmp-person cmp-person--${side}`}>
    <p className="cmp-who"><i />{label}</p>
    <h2 className="cmp-title">{archetype.title}</h2>
    <p className="cmp-role">{archetype.roleBadge}</p>
    <p className="cmp-meta">{portraitDate(record)} · {answerCount(record)} 题画像</p>
  </div>;
}

/* ── 一条维度的小尺子 ─────────────────────────────────────────── */
function MiniTrack({ dimension }) {
  const x = (value) => 10 + ((value + 1) / 2) * 180;
  const xA = x(dimension.a);
  const xB = x(dimension.b);
  return <svg viewBox="0 0 200 20" className="cmp-minitrack" role="img"
    aria-label={`${dimension.name}：你${signed(dimension.a)}，ta ${signed(dimension.b)}`}>
    <line x1="10" x2="190" y1="10" y2="10" stroke="rgba(160,155,148,0.16)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="100" x2="100" y1="6" y2="14" stroke="rgba(160,155,148,0.30)" strokeWidth="0.75" />
    <line x1={xA} x2={xB} y1="10" y2="10" stroke="rgba(123,134,178,0.45)" strokeWidth="2" strokeLinecap="round" />
    <path d={`M${xA},6.4 L${xA + 3.6},10 L${xA},13.6 L${xA - 3.6},10 Z`} fill="rgb(151,130,191)" />
    <circle cx={xB} cy="10" r="3.1" fill="#fbf9f6" stroke="rgb(83,145,163)" strokeWidth="1.4" />
  </svg>;
}

/* ── 关系切片 ─────────────────────────────────────────────────── */
function InsightCard({ dimension, name, variant }) {
  const isClose = variant === 'close';
  const cardRef = useRef(null);
  const a = tendency(dimension.a, dimension);
  const b = tendency(dimension.b, dimension);

  const tilt = (event) => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
    node.style.setProperty('--glow-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    node.style.setProperty('--glow-y', `${((y + 0.5) * 100).toFixed(1)}%`);
  };

  const reset = () => {
    const node = cardRef.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return <section ref={cardRef} onPointerMove={tilt} onPointerLeave={reset}
    className={`cmp-card cmp-insight cmp-insight--${variant}`}>
    <div className="cmp-insight-head">
      <span className="cmp-eyebrow">
        {isClose ? <Sparkles size={12} /> : <ArrowLeftRight size={12} />}
        {isClose ? '你们靠近的地方' : '你们不同的视角'}
      </span>
      <span className="cmp-gap">{dimension.gap.toFixed(2)}</span>
    </div>
    <h3 className="cmp-insight-title">{dimension.name}</h3>
    <MiniTrack dimension={dimension} />
    <dl className="cmp-spec">
      <div><dt className="cmp-ink-mine">你</dt><dd>{a}</dd><dd className="cmp-val">{signed(dimension.a)}</dd></div>
      <div><dt className="cmp-ink-theirs">{name}</dt><dd>{b}</dd><dd className="cmp-val">{signed(dimension.b)}</dd></div>
    </dl>
    <p className="cmp-insight-foot">
      {isClose
        ? (a === b ? `同一个位置 · 你们都偏向「${a}」` : '两处标记几乎叠在一起')
        : `这是你们相距最远的一处 · ${a} 与 ${b}`}
    </p>
  </section>;
}

/* ── 维度轨道 ─────────────────────────────────────────────────── */
function DimensionTrack({ dimension, name, index, active, onSelect }) {
  const gradientId = useId();
  const xA = 20 + (dimension.a + 1) * 180;
  const xB = 20 + (dimension.b + 1) * 180;
  const crowded = Math.abs(xA - xB) < 18;
  const yA = crowded ? 13 : 22;
  const yB = crowded ? 31 : 22;
  const label = `${dimension.name}：你${tendency(dimension.a, dimension)}，${name}${tendency(dimension.b, dimension)}`;

  return <button onClick={onSelect} aria-pressed={active} style={{ '--i': index }}
    className={`cmp-dimension ${active ? 'is-active' : ''}`}>
    <div className="cmp-dimension-head">
      <h3>{dimension.name}</h3>
      <span className="cmp-gap">{dimension.gap.toFixed(2)}</span>
    </div>
    <div className="cmp-poles">
      <span>{dimension.negative}</span><span>{dimension.positive}</span>
    </div>
    <svg viewBox="0 0 400 44" role="img" aria-label={label} className="cmp-track">
      <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={xA} x2={xB} y1="0" y2="0">
        <stop stopColor="rgb(151,130,191)" stopOpacity="0.65" /><stop offset="1" stopColor="rgb(83,145,163)" stopOpacity="0.65" />
      </linearGradient></defs>
      <line x1="20" x2="380" y1="22" y2="22" stroke="rgba(160,150,139,0.14)" strokeWidth="3" strokeLinecap="round" />
      {[20, 110, 200, 290, 380].map((x) => <line key={x} x1={x} x2={x} y1="18" y2="26" stroke="rgba(160,150,139,0.24)" strokeWidth="0.75" />)}
      {xA !== xB && <line x1={xA} x2={xB} y1="22" y2="22" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />}
      {crowded && <>
        <line x1={xA} x2={xA} y1={yA} y2="22" stroke="rgb(151,130,191)" strokeOpacity="0.45" strokeWidth="0.75" />
        <line x1={xB} x2={xB} y1="22" y2={yB} stroke="rgb(83,145,163)" strokeOpacity="0.45" strokeWidth="0.75" />
      </>}
      <path d={`M ${xA} ${yA - 5.5} L ${xA + 5.5} ${yA} L ${xA} ${yA + 5.5} L ${xA - 5.5} ${yA} Z`} fill="rgb(151,130,191)" stroke="#fbf9f6" strokeWidth="1.5" />
      <circle cx={xB} cy={yB} r="5" fill="#fbf9f6" stroke="rgb(83,145,163)" strokeWidth="2" />
    </svg>
  </button>;
}

function ComparisonMap({ mine, theirs, name, pair }) {
  const container = useRef(null);
  const [size, setSize] = useState(520);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize(Math.min(520, Math.floor(entry.contentRect.width)));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return <div className="cmp-map-canvas" ref={container}>
    <TraitSpace2D userVector={mine.result.userVector} xKey={pair.xKey} yKey={pair.yKey}
      width={size} height={size} showArchetypes showArchetypeLabels={false} userColor={MINE_COLOR}
      participants={[{ label: name, vector: theirs.result.userVector, color: THEIRS_COLOR }]} />
  </div>;
}

export default function Comparison({ mine, theirs, onBack }) {
  const [pairIndex, setPairIndex] = useState(0);
  const [sort, setSort] = useState('difference');
  const [expanded, setExpanded] = useState(false);
  const mapSection = useRef(null);
  const pair = DIMENSION_PAIRS[pairIndex];
  const name = theirs.nickname || 'ta';
  const dimensions = useMemo(
    () => compareDimensions(mine.result.userVector, theirs.result.userVector),
    [mine, theirs],
  );

  const stats = useMemo(() => {
    const overlap = Math.round(
      (dimensions.reduce((sum, d) => sum + (1 - Math.min(1, d.gap / 2)), 0) / dimensions.length) * 100,
    );
    const sameSide = dimensions.filter((d) => tendency(d.a, d) === tendency(d.b, d)).length;
    return {
      overlap,
      sameSide,
      closest: dimensions[0],
      furthest: dimensions.at(-1),
      complements: dimensions.filter((d) => d.gap >= 0.35).length,
    };
  }, [dimensions]);

  const shownOverlap = useCountUp(stats.overlap);
  const ordered = sort === 'difference' ? [...dimensions].reverse() : dimensions;
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_DIMENSIONS);
  const mineCount = answerCount(mine);
  const theirsCount = answerCount(theirs);

  const headline = stats.sameSide >= 7 ? '你们大多数时候站在同一边'
    : stats.sameSide >= 4 ? '你们一半重合，一半互为补充'
      : '你们几乎从相反的方向看世界';

  const selectDimension = (key) => {
    setPairIndex(DIMENSION_PAIRS.findIndex((item) => item.xKey === key || item.yKey === key));
    if (window.innerWidth < 1024) {
      mapSection.current.scrollIntoView({ block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  return <div className="cmp-page max-w-6xl mx-auto px-5 sm:px-8 py-8 md:py-10">
    <header className="cmp-header">
      <button onClick={onBack} aria-label="返回画像选择" className="cmp-back"><ArrowLeft size={17} /></button>
      <div className="min-w-0">
        <p className="cmp-micro">BLUR TOGETHER</p>
        <h1 className="cmp-h1">你与 {name} 的共同画像</h1>
      </div>
    </header>

    <section className="cmp-hero" aria-label="参与对比的两份画像">
      <div className="cmp-hero-head">
        <PortraitIdentity record={mine} label="你" side="mine" />
        <PortraitIdentity record={theirs} label={name} side="theirs" />
      </div>

      <div className="cmp-stage">
        <CompareField overlap={stats.overlap} />
        <div className="cmp-stage-num">
          <span className="cmp-stage-k">重合度</span>
          <span className="cmp-stage-v">{shownOverlap}<em>%</em></span>
        </div>
      </div>

      <div className="cmp-hero-foot">
        <div className="cmp-stat">
          <span className="cmp-stat-k">同侧维度</span>
          <span className="cmp-stat-v">{stats.sameSide}<em>/ 10</em></span>
        </div>
        <div className="cmp-stat">
          <span className="cmp-stat-k">最大距离</span>
          <span className="cmp-stat-v">{stats.furthest.gap.toFixed(2)}<em>{stats.furthest.name}</em></span>
        </div>
        <div className="cmp-stat">
          <span className="cmp-stat-k">互补维度</span>
          <span className="cmp-stat-v">{stats.complements}<em>个</em></span>
        </div>
        <p className="cmp-hero-note">{headline}。相距最远的一处是「{stats.furthest.name}」。</p>
      </div>
    </section>

    <div className="cmp-insights">
      <InsightCard dimension={stats.closest} name={name} variant="close" />
      <InsightCard dimension={stats.furthest} name={name} variant="different" />
    </div>

    <div className="cmp-body">
      <section className="cmp-map-col" ref={mapSection}>
        <div className="cmp-card cmp-map">
          <div className="cmp-section-head">
            <div>
              <p className="cmp-eyebrow"><Compass size={12} />你们的位置</p>
              <h2 className="cmp-h2">{pair.label.replace('·', '与')}</h2>
            </div>
            <span className="cmp-index">0{pairIndex + 1}<span> / 05</span></span>
          </div>
          <ComparisonMap mine={mine} theirs={theirs} name={name} pair={pair} />
          <div className="cmp-legend">
            <span className="cmp-ink-mine"><i className="cmp-mark cmp-mark--mine" />你 · {mine.result.archetype.title}</span>
            <span className="cmp-ink-theirs"><i className="cmp-mark cmp-mark--theirs" />{name} · {theirs.result.archetype.title}</span>
          </div>
          <div className="cmp-tabs">
            <DraggableTabs tabs={DIMENSION_PAIRS.map((item) => ({ key: item.key, label: item.label }))}
              activeIndex={pairIndex} onChange={setPairIndex} className="w-full" tabClassName="px-2 py-2.5 text-[10px]" />
          </div>
        </div>
        <p className="cmp-hint"><MoveUpRight size={12} />切换坐标，看看你们在不同侧面的距离。也可以点选维度，切换到对应坐标。</p>
      </section>

      <section className="cmp-card cmp-spectrum">
        <div className="cmp-section-head cmp-section-head--block">
          <div>
            <p className="cmp-eyebrow">SIDE BY SIDE</p>
            <h2 className="cmp-h2">十个维度，两种倾向</h2>
          </div>
          <div className="cmp-legend cmp-legend--inline">
            <span className="cmp-ink-mine"><i className="cmp-mark cmp-mark--mine" />你</span>
            <span className="cmp-ink-theirs"><i className="cmp-mark cmp-mark--theirs" />{name}</span>
          </div>
          <div className="cmp-sort" role="group" aria-label="维度排序">
            <button aria-pressed={sort === 'difference'} className={sort === 'difference' ? 'is-selected' : ''} onClick={() => setSort('difference')}>先看差异</button>
            <button aria-pressed={sort === 'similarity'} className={sort === 'similarity' ? 'is-selected' : ''} onClick={() => setSort('similarity')}>寻找相近</button>
          </div>
        </div>
        <div className="cmp-rows">
          {visible.map((dimension, index) => <DimensionTrack key={`${sort}-${dimension.key}`} dimension={dimension} name={name}
            index={index} active={dimension.key === pair.xKey || dimension.key === pair.yKey}
            onSelect={() => selectDimension(dimension.key)} />)}
        </div>
        <button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="cmp-expand">
          {expanded ? '收起维度' : `查看全部 ${dimensions.length} 个维度`}
          <ChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {mineCount !== theirsCount && <p className="cmp-note">你作答 {mineCount} 题，{name}作答 {theirsCount} 题。作答数量不同，画像细节也可能不同。</p>}
      </section>
    </div>

    <footer className="cmp-footer">
      <p>这里呈现的是本次作答中的相对倾向，不是关系契合度。你的画像只用于当前对比，不会因此公开给对方。</p>
    </footer>
  </div>;
}
