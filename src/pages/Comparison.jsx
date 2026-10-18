import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import TraitSpace2D from '../components/TraitSpace2D';
import DraggableTabs from '../components/DraggableTabs';
import { DIMENSION_PAIRS } from '../utils/blurEngine';
import { compareDimensions, tendency } from '../utils/comparison';

export default function Comparison({ mine, theirs, onBack }) {
  const [pairIndex, setPairIndex] = useState(0);
  const pair = DIMENSION_PAIRS[pairIndex];
  const dimensions = compareDimensions(mine.result.userVector, theirs.result.userVector);
  const name = theirs.nickname || 'ta';
  const closest = dimensions[0];
  const furthest = dimensions.at(-1);

  return <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <header className="flex items-center gap-4 mb-6">
      <button onClick={onBack} aria-label="返回画像选择" className="glass rounded-full p-3 cursor-pointer"><ArrowLeft size={18} /></button>
      <div><p className="text-[10px] tracking-[0.25em] text-blur-text-light">BLUR TOGETHER</p>
        <h1 className="text-xl mt-1">你与 {name} 的共同画像</h1></div>
    </header>
    <div className="grid gap-6 md:grid-cols-2">
      <section className="min-w-0">
        <div className="glass rounded-3xl p-3 flex flex-col items-center">
          <TraitSpace2D userVector={mine.result.userVector} xKey={pair.xKey} yKey={pair.yKey}
            width={300} height={300} participants={[{ label: name, vector: theirs.result.userVector }]} />
          <p className="text-xs text-blur-text-muted pb-4">◆ 你 · {mine.result.archetype.title} <span className="text-[#5c8d9f]">○ {name} · {theirs.result.archetype.title}</span></p>
        </div>
        <DraggableTabs tabs={DIMENSION_PAIRS.map((item) => ({ key: item.key, label: item.label }))}
          activeIndex={pairIndex} onChange={setPairIndex} className="mt-4 w-full" tabClassName="px-2 py-2 text-[10px]" />
        <div className="glass rounded-2xl p-5 mt-5 text-sm space-y-4">
          <div><p className="text-blur-accent text-xs mb-1">本次画像中最接近的维度</p>
            <p>{closest.name}</p><p className="text-xs text-blur-text-muted mt-1">你：{tendency(closest.a, closest)} · {name}：{tendency(closest.b, closest)}</p></div>
          <div><p className="text-[#5c8d9f] text-xs mb-1">本次画像中差异最大的维度</p>
            <p>{furthest.name}</p><p className="text-xs text-blur-text-muted mt-1">你：{tendency(furthest.a, furthest)} · {name}：{tendency(furthest.b, furthest)}</p></div>
        </div>
      </section>
      <section className="glass rounded-3xl p-5 space-y-5 min-w-0">
        <div><h2 className="text-sm">十个维度，两种倾向</h2>
          <p className="text-[11px] text-blur-text-muted mt-2">你作答 {mine.answerCount || Object.keys(mine.answers || {}).length} 题 · {name}作答 {theirs.answerCount} 题。作答数量不同，画像细节也可能不同。</p></div>
        {dimensions.map((dimension) => <div key={dimension.key}>
          <h3 className="text-xs mb-1.5">{dimension.name}</h3>
          <div className="flex justify-between text-[10px] text-blur-text-muted gap-3"><span>{dimension.negative}</span><span>{dimension.positive}</span></div>
          <div className="relative h-9 mt-1 rounded-lg bg-white/40" aria-label={`${dimension.name}：你${tendency(dimension.a, dimension)}，${name}${tendency(dimension.b, dimension)}`}>
            <span className="absolute left-1/2 top-1 bottom-1 border-l border-dashed border-blur-border" />
            <span className="absolute top-1 text-blur-accent -translate-x-1/2 text-xs" style={{ left: `${5 + (dimension.a + 1) * 45}%` }}>◆</span>
            <span className="absolute bottom-0.5 text-[#5c8d9f] -translate-x-1/2 text-sm" style={{ left: `${5 + (dimension.b + 1) * 45}%` }}>○</span>
          </div>
        </div>)}
      </section>
    </div>
    <p className="text-xs text-blur-text-muted leading-relaxed mt-6">坐标表达各自本次作答中的相对倾向，不能衡量真实能力或关系契合度。你的画像只用于当前对比，不会因此公开给对方。</p>
  </div>;
}
