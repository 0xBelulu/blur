import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, ChevronDown, Compass, Fingerprint, MoveUpRight, Sparkles } from 'lucide-react';
import TraitSpace2D from '../components/TraitSpace2D';
import DraggableTabs from '../components/DraggableTabs';
import { DIMENSION_PAIRS } from '../utils/blurEngine';
import { compareDimensions, tendency } from '../utils/comparison';
import './Comparison.css';

const INITIAL_DIMENSIONS = 6;
const MINE_COLOR = [151, 130, 191];
const THEIRS_COLOR = [83, 145, 163];

function portraitDate(record) {
  return new Date(record.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function PortraitIdentity({ record, label, side }) {
  const { archetype } = record.result;
  const count = record.answerCount || Object.keys(record.answers || {}).length;
  return <div className={`comparison-person comparison-person--${side}`}>
    <div className="comparison-avatar" aria-hidden="true">{archetype.symbol}</div>
    <div className="min-w-0">
      <p className="comparison-person-label truncate" title={label}>{label}</p>
      <h2 className="mt-1 text-xl sm:text-2xl font-medium tracking-tight">{archetype.title}</h2>
      <p className="mt-1 text-xs text-blur-text-muted leading-relaxed">{archetype.roleBadge}</p>
      <p className="mt-2 text-[10px] text-blur-text-light">{portraitDate(record)} · {count} 题画像</p>
    </div>
  </div>;
}

function InsightCard({ dimension, name, variant, identical }) {
  const isClose = variant === 'close';
  const a = tendency(dimension.a, dimension);
  const b = tendency(dimension.b, dimension);
  const common = a === b;
  return <section className={`comparison-insight comparison-insight--${variant}`}>
    <div className="comparison-insight-icon" aria-hidden="true">{isClose ? <Sparkles size={17} /> : <ArrowLeftRight size={17} />}</div>
    <div className="min-w-0">
      <p className="text-[10px] tracking-wider text-blur-text-muted">{isClose ? '你们靠近的地方' : identical ? '重合的画像' : '你们不同的视角'}</p>
      <h2 className="text-base font-medium mt-1.5">{identical && !isClose ? '这次的坐标恰好重合' : dimension.name}</h2>
      <p className="mt-2 text-xs text-blur-text-muted leading-relaxed">
        {isClose && common ? (a === '倾向居中' ? '你们都处在这条轴的中间地带。' : <>共同偏向「{a}」</>) :
          identical ? '换一组坐标，也能看到相同的位置。' : <><span className="comparison-ink-mine">你 · {a}</span><span className="mx-2 opacity-40">/</span><span className="comparison-ink-theirs">{name} · {b}</span></>}
      </p>
    </div>
  </section>;
}

function DimensionTrack({ dimension, name, active, onSelect }) {
  const gradientId = useId();
  const xA = 20 + (dimension.a + 1) * 180;
  const xB = 20 + (dimension.b + 1) * 180;
  const crowded = Math.abs(xA - xB) < 18;
  const yA = crowded ? 13 : 22;
  const yB = crowded ? 31 : 22;
  const label = `${dimension.name}：你${tendency(dimension.a, dimension)}，${name}${tendency(dimension.b, dimension)}`;

  return <button onClick={onSelect} aria-pressed={active} className={`comparison-dimension ${active ? 'is-active' : ''}`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-xs font-medium">{dimension.name}</h3>
      {active && <span className="text-[9px] comparison-ink-mine">当前坐标</span>}
    </div>
    <div className="mt-2 flex justify-between gap-3 text-[10px] text-blur-text-muted">
      <span>{dimension.negative}</span><span className="text-right">{dimension.positive}</span>
    </div>
    <svg viewBox="0 0 400 44" role="img" aria-label={label} className="comparison-track">
      <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={xA} x2={xB} y1="0" y2="0">
        <stop stopColor="rgb(151,130,191)" stopOpacity="0.6" /><stop offset="1" stopColor="rgb(83,145,163)" stopOpacity="0.6" />
      </linearGradient></defs>
      <line x1="20" x2="380" y1="22" y2="22" stroke="rgba(160,150,139,0.14)" strokeWidth="4" strokeLinecap="round" />
      {[20, 110, 200, 290, 380].map((x) => <line key={x} x1={x} x2={x} y1="18" y2="26" stroke="rgba(160,150,139,0.28)" strokeWidth="1" />)}
      {xA !== xB && <line x1={xA} x2={xB} y1="22" y2="22" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />}
      {crowded && <>
        <line x1={xA} x2={xA} y1={yA} y2="22" stroke="rgb(151,130,191)" strokeOpacity="0.5" />
        <line x1={xB} x2={xB} y1="22" y2={yB} stroke="rgb(83,145,163)" strokeOpacity="0.5" />
      </>}
      <path d={`M ${xA} ${yA - 6} L ${xA + 6} ${yA} L ${xA} ${yA + 6} L ${xA - 6} ${yA} Z`} fill="rgb(151,130,191)" stroke="#faf9f7" strokeWidth="2" />
      <circle cx={xB} cy={yB} r="5.5" fill="#faf9f7" stroke="rgb(83,145,163)" strokeWidth="2.5" />
    </svg>
  </button>;
}

function ComparisonMap({ mine, theirs, name, pair }) {
  const container = useRef(null);
  const [size, setSize] = useState(480);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize(Math.min(480, Math.floor(entry.contentRect.width)));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return <div className="comparison-map-canvas" ref={container}>
    <TraitSpace2D userVector={mine.result.userVector} xKey={pair.xKey} yKey={pair.yKey}
      width={size} height={size} showArchetypes={false} userColor={MINE_COLOR}
      participants={[{ label: name, vector: theirs.result.userVector, color: THEIRS_COLOR }]} />
  </div>;
}

export default function Comparison({ mine, theirs, onBack }) {
  const [pairIndex, setPairIndex] = useState(0);
  const [sort, setSort] = useState('difference');
  const [expanded, setExpanded] = useState(false);
  const mapSection = useRef(null);
  const pair = DIMENSION_PAIRS[pairIndex];
  const dimensions = compareDimensions(mine.result.userVector, theirs.result.userVector);
  const name = theirs.nickname || 'ta';
  const closest = dimensions[0];
  const furthest = dimensions.at(-1);
  const ordered = sort === 'difference' ? [...dimensions].reverse() : dimensions;
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_DIMENSIONS);
  const mineCount = mine.answerCount || Object.keys(mine.answers || {}).length;
  const theirsCount = theirs.answerCount || Object.keys(theirs.answers || {}).length;

  const selectDimension = (key) => {
    setPairIndex(DIMENSION_PAIRS.findIndex((item) => item.xKey === key || item.yKey === key));
    if (window.innerWidth < 1024) {
      mapSection.current.scrollIntoView({ block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  return <div className="comparison-page max-w-6xl mx-auto px-5 sm:px-8 py-7 md:py-10">
    <header className="flex items-center gap-4 mb-7 md:mb-9">
      <button onClick={onBack} aria-label="返回画像选择" className="comparison-back glass rounded-full p-3 sm:p-3.5 cursor-pointer"><ArrowLeft size={18} /></button>
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.28em] text-blur-text-light">BLUR TOGETHER</p>
        <h1 className="text-xl sm:text-2xl font-medium tracking-tight mt-1.5 break-words">你与 {name} 的共同画像</h1>
      </div>
    </header>

    <section className="comparison-portraits glass rounded-[28px] sm:rounded-[32px] mb-5" aria-label="参与对比的两份画像">
      <div className="comparison-portrait-grid">
        <PortraitIdentity record={mine} label="你 · 这一次的画像" side="mine" />
        <div className="comparison-between" aria-hidden="true"><ArrowLeftRight size={17} /></div>
        <PortraitIdentity record={theirs} label={name} side="theirs" />
      </div>
      <div className="comparison-portrait-caption">
        <Fingerprint size={13} className="shrink-0 opacity-60" />
        <p>相似与不同，都是认识彼此的线索。</p>
      </div>
    </section>

    <div className="grid sm:grid-cols-2 gap-3 sm:gap-5 mb-6">
      <InsightCard dimension={closest} name={name} variant="close" />
      <InsightCard dimension={furthest} name={name} variant="different" identical={furthest.gap === 0} />
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-start">
      <section className="min-w-0 lg:sticky lg:top-6 scroll-mt-5" ref={mapSection}>
        <div className="comparison-map glass rounded-[28px] sm:rounded-[32px] overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 sm:px-7 pt-6">
            <div><p className="comparison-eyebrow"><Compass size={12} />你们的位置</p>
              <h2 className="text-base font-medium mt-2">{pair.label.replace('·', '与')}</h2></div>
            <span className="comparison-view-number">0{pairIndex + 1}<span className="text-blur-text-light"> / 05</span></span>
          </div>
          <ComparisonMap mine={mine} theirs={theirs} name={name} pair={pair} />
          <div className="comparison-map-legend">
            <span className="comparison-ink-mine"><i className="comparison-mark comparison-mark--mine" />你 · {mine.result.archetype.title}</span>
            <span className="comparison-ink-theirs"><i className="comparison-mark comparison-mark--theirs" />{name} · {theirs.result.archetype.title}</span>
          </div>
          <div className="px-3 sm:px-5 pb-5">
            <DraggableTabs tabs={DIMENSION_PAIRS.map((item) => ({ key: item.key, label: item.label }))}
              activeIndex={pairIndex} onChange={setPairIndex} className="w-full" tabClassName="px-2 py-2.5 text-[10px]" />
          </div>
        </div>
        <p className="flex gap-2 items-start px-2 mt-4 text-[11px] text-blur-text-muted leading-relaxed"><MoveUpRight size={13} className="shrink-0 mt-0.5 opacity-60" />切换坐标，看看你们在不同侧面的距离。也可以点选维度，切换到对应坐标。</p>
      </section>

      <section className="comparison-spectrum glass rounded-[28px] sm:rounded-[32px] min-w-0 overflow-hidden">
        <div className="px-5 sm:px-7 pt-6 pb-4">
          <p className="comparison-eyebrow">SIDE BY SIDE</p>
          <h2 className="text-base font-medium mt-2">十个维度，两种倾向</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[11px]">
            <span className="comparison-ink-mine flex items-center gap-2"><i className="comparison-mark comparison-mark--mine" />你</span>
            <span className="comparison-ink-theirs flex items-center gap-2 min-w-0"><i className="comparison-mark comparison-mark--theirs" /><span className="truncate max-w-40">{name}</span></span>
          </div>
          <div className="comparison-sort mt-5" role="group" aria-label="维度排序">
            <button aria-pressed={sort === 'difference'} className={sort === 'difference' ? 'is-selected' : ''} onClick={() => setSort('difference')}>先看差异</button>
            <button aria-pressed={sort === 'similarity'} className={sort === 'similarity' ? 'is-selected' : ''} onClick={() => setSort('similarity')}>寻找相近</button>
          </div>
        </div>
        <div className="px-3 sm:px-5">
          {visible.map((dimension) => <DimensionTrack key={dimension.key} dimension={dimension} name={name}
            active={dimension.key === pair.xKey || dimension.key === pair.yKey} onSelect={() => selectDimension(dimension.key)} />)}
        </div>
        <button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
          className="comparison-expand w-full flex justify-center items-center gap-2 py-4 text-xs text-blur-text-muted cursor-pointer">
          {expanded ? '收起维度' : `查看全部 ${dimensions.length} 个维度`}<ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {mineCount !== theirsCount && <p className="px-5 sm:px-7 pb-5 text-[10px] text-blur-text-muted leading-relaxed">你作答 {mineCount} 题，{name}作答 {theirsCount} 题。作答数量不同，画像细节也可能不同。</p>}
      </section>
    </div>
    <footer className="comparison-footer mt-8 pt-5 text-[11px] text-blur-text-muted leading-relaxed">
      <p>这里呈现的是本次作答中的相对倾向，不是关系契合度。你的画像只用于当前对比，不会因此公开给对方。</p>
    </footer>
  </div>;
}
