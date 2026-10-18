import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Compass, MoveUpRight } from 'lucide-react';
import TraitSpace2D from '../components/TraitSpace2D';
import DraggableTabs from '../components/DraggableTabs';
import CompareField from '../components/CompareField';
import { DIMENSION_PAIRS } from '../utils/blurEngine';
import { compareDimensions, tendency } from '../utils/comparison';
import { buildComparisonStory } from '../utils/comparisonStory';
import { comparisonPrompts } from '../utils/comparisonPrompts';
import './Comparison.css';

const INITIAL_DIMENSIONS = 6;
const MINE_COLOR = [151, 130, 191];
const THEIRS_COLOR = [83, 145, 163];

function portraitDate(record) {
  return new Date(record.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function answerCount(record) {
  return record.answerCount || Object.keys(record.answers || {}).length;
}

function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0
  ));
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
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
function Person({ record, label, side }) {
  const { archetype } = record.result;
  return <div className={`cmp-person cmp-person--${side}`}>
    <p className="cmp-who"><i />{label}</p>
    <h2 className="cmp-person-title">{archetype.title}</h2>
    <p className="cmp-person-role">{archetype.roleBadge}</p>
    <p className="cmp-person-meta">{portraitDate(record)} · {answerCount(record)} 题</p>
  </div>;
}

/* ── 维度轨道 ─────────────────────────────────────────────────── */
function DimensionTrack({ dimension, name, active, onSelect }) {
  const gradientId = useId();
  const left = 26;
  const span = 848;
  const x = (value) => left + ((value + 1) / 2) * span;
  const xA = x(dimension.a);
  const xB = x(dimension.b);
  const crowded = Math.abs(xA - xB) < 18;
  const yA = crowded ? 12 : 22;
  const yB = crowded ? 32 : 22;
  const label = `${dimension.name}：你${tendency(dimension.a, dimension)}，${name}${tendency(dimension.b, dimension)}`;

  return <button onClick={onSelect} aria-pressed={active} className={`cmp-dimension ${active ? 'is-active' : ''}`}>
    <div className="cmp-dimension-head">
      <h3>{dimension.name}</h3>
      <span className="cmp-gap">{dimension.gap.toFixed(2)}</span>
    </div>
    <div className="cmp-poles">
      <span>{dimension.negative}</span><span>{dimension.positive}</span>
    </div>
    <svg viewBox="0 0 900 44" role="img" aria-label={label} className="cmp-track">
      <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={xA} x2={xB} y1="0" y2="0">
        <stop stopColor="rgb(151,130,191)" stopOpacity="0.65" /><stop offset="1" stopColor="rgb(83,145,163)" stopOpacity="0.65" />
      </linearGradient></defs>
      <line x1={left} x2={left + span} y1="22" y2="22" stroke="rgba(160,150,139,0.14)" strokeWidth="3" strokeLinecap="round" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const tick = left + t * span;
        return <line key={t} x1={tick} x2={tick} y1="18" y2="26" stroke="rgba(160,150,139,0.24)" strokeWidth="0.75" />;
      })}
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
  const [size, setSize] = useState(460);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize(Math.min(460, Math.floor(entry.contentRect.width)));
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

/* ── 同题对照 ─────────────────────────────────────────────────── */
function MomentCard({ item, tone, name, count, total }) {
  const same = tone === 'same';
  return <section className={`cmp-card cmp-moment cmp-moment--${tone}`}>
    <div className="cmp-moment-head">
      <span className="cmp-eyebrow">{same ? '同一道题' : '分岔'}</span>
      <span className="cmp-gap">{count} / {total}</span>
    </div>
    <p className="cmp-moment-q">「{item.text}」</p>
    {same
      ? <div className="cmp-moment-same">
        <div className="cmp-moment-names">
          <span className="cmp-moment-who cmp-ink-mine">你</span>
          <span className="cmp-moment-who cmp-ink-theirs">{name}</span>
        </div>
        <p>{item.mine}</p>
      </div>
      : <div className="cmp-moment-split">
        <div><span className="cmp-moment-who cmp-ink-mine">你</span><p>{item.mine}</p></div>
        <div><span className="cmp-moment-who cmp-ink-theirs">{name}</span><p>{item.theirs}</p></div>
      </div>}
  </section>;
}

export default function Comparison({ mine, theirs, onBack, friendView = false }) {
  const [pairIndex, setPairIndex] = useState(0);
  const [sort, setSort] = useState('difference');
  const [expanded, setExpanded] = useState(false);
  const pair = DIMENSION_PAIRS[pairIndex];
  const name = theirs.nickname || 'ta';
  const dimensions = useMemo(
    () => compareDimensions(mine.result.userVector, theirs.result.userVector),
    [mine, theirs],
  );
  const story = useMemo(() => buildComparisonStory(mine, theirs), [mine, theirs]);

  const stats = useMemo(() => {
    const overlap = Math.round(
      (dimensions.reduce((sum, d) => sum + (1 - Math.min(1, d.gap / 2)), 0) / dimensions.length) * 100,
    );
    const sameSide = dimensions.filter((d) => tendency(d.a, d) === tendency(d.b, d)).length;
    return {
      overlap,
      sameSide,
      furthest: dimensions.at(-1),
      complements: dimensions.filter((d) => d.gap >= 0.35).length,
    };
  }, [dimensions]);

  const shownOverlap = useCountUp(stats.overlap);
  const ordered = sort === 'difference' ? [...dimensions].reverse() : dimensions;
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_DIMENSIONS);
  const furthest = stats.furthest;
  const prompts = comparisonPrompts(dimensions);

  return <div className="cmp-page max-w-6xl mx-auto px-5 sm:px-8 py-8">
    <header className="cmp-header">
      <button onClick={onBack} aria-label="返回画像选择" className="cmp-back"><ArrowLeft size={17} /></button>
      <div className="min-w-0">
        <p className="cmp-micro">BLUR TOGETHER</p>
        <h1 className="cmp-h1">你与 {name} 的共同画像</h1>
      </div>
    </header>

    <section className="cmp-summary" aria-label="对比总览">
      <div className="cmp-summary-grid">
        <Person record={mine} label="你" side="mine" />

        <div className="cmp-stage">
          <CompareField overlap={stats.overlap} />
          <div className="cmp-stage-num">
            <span className="cmp-stage-k">倾向重合</span>
            <span className="cmp-stage-v">{shownOverlap}<em>%</em></span>
          </div>
        </div>

        <Person record={theirs} label={name} side="theirs" />
      </div>

      <div className={`cmp-metrics ${story.sharedCount ? '' : 'cmp-metrics--portrait'}`}>
        <div><span>同侧维度</span><b>{stats.sameSide}<em>/ 10</em></b></div>
        <div><span>最大距离</span><b>{furthest.gap.toFixed(2)}<em>{furthest.name}</em></b></div>
        <div><span>明显差异</span><b>{stats.complements}<em>个维度</em></b></div>
        {story.sharedCount > 0 && <><div><span>共同作答</span><b>{story.sharedCount}<em>题</em></b></div>
          <div><span>答案相同</span><b>{story.sameCount}<em>题</em></b></div></>}
      </div>
    </section>

    <div className="cmp-conversations">
      {prompts.map(({ dimension: d, label, scene, question }) => <section className="cmp-conversation" key={d.key}>
        <p className="cmp-eyebrow">{label} · {d.name}</p><h2>{scene}</h2>
        <div className="cmp-conversation-tendencies"><span className="cmp-ink-mine">你 · {tendency(d.a, d)}</span><span className="cmp-ink-theirs">{name} · {tendency(d.b, d)}</span></div>
        <p>{question}</p>
      </section>)}
    </div>

    <div className="cmp-body">
      <section className="cmp-map-col">
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
          {visible.map((dimension) => <DimensionTrack key={`${sort}-${dimension.key}`} dimension={dimension} name={name}
            active={dimension.key === pair.xKey || dimension.key === pair.yKey}
            onSelect={() => setPairIndex(DIMENSION_PAIRS.findIndex((item) => item.xKey === dimension.key || item.yKey === dimension.key))} />)}
        </div>
        <button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="cmp-expand">
          {expanded ? '收起维度' : `查看全部 ${dimensions.length} 个维度`}
          <ChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </section>
    </div>

    {(story.bestSame || story.bestSplit) && <div className="cmp-moments">
      {story.bestSame && <MomentCard item={story.bestSame} tone="same" name={name}
        count={story.sameCount} total={story.sharedCount} />}
      {story.bestSplit && <MomentCard item={story.bestSplit} tone="split" name={name}
        count={story.splitCount} total={story.sharedCount} />}
    </div>}

    <footer className="cmp-footer">
      <p>这里呈现的是本次作答中的相对倾向，不是关系契合度。「明显差异」指维度差距至少 0.35。可以拿这些小问题聊聊，看看实际的你们是什么样。
        {friendView ? ' 双方使用当前主动展示给好友的画像，具体作答保持私密。' : ' 你的画像只用于当前对比，不会因此公开给对方。'}</p>
    </footer>
  </div>;
}
