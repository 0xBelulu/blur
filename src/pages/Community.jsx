import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import CommunityField from '../components/CommunityField';
import GlassButton from '../components/GlassButton';
import Reveal from '../components/Reveal';
import Eyebrow from '../components/Eyebrow';
import ChromaticTitle from '../components/ChromaticTitle';
import { axisTendency, PROJECTION_AXIS_COPY } from '../../shared/projection.js';
import { readCommunityField, localFieldPoint, withdrawFieldPoint } from '../utils/community';
import { displayRecord, recordArchetype } from '../utils/portraits';

const TITLE_CLASS = 'text-[2.3rem] leading-[1.1] tracking-tight font-medium md:text-[3.6rem]';

function TitleLines({ highlighted = false }) {
  return (
    <>
      这里的每个人
      <br />
      <span className={highlighted ? 'font-light text-blur-text/70' : 'font-light'}>都是一个点</span>
    </>
  );
}

function SectionTag({ index, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] tabular-nums tracking-[0.1em] text-blur-text-muted">{index}</span>
      <span className="text-[11px] tracking-[0.24em] text-blur-text/85">{label}</span>
      <span className="h-px flex-1 bg-blur-border/45" />
    </div>
  );
}

const SEEN = ['有多少人在这里', '你自己落在哪', '哪一片比较密'];
const UNSEEN = ['谁是谁', '名字、原型、什么时候来的', '点开任何一个人'];

export default function Community({ records, account, onBack, onOpenMy, onOpenNext, onStart }) {
  const [field, setField] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [localPoint, setLocalPoint] = useState(localFieldPoint);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    readCommunityField(AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]))
      .then((data) => { if (!controller.signal.aborted) { setField(data); setError(''); } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [revision, account.id]);

  const retry = useCallback(() => { setField(null); setRevision((value) => value + 1); }, []);
  const withdraw = async () => {
    setNotice('');
    try {
      await withdrawFieldPoint();
      setLocalPoint(null);
      setNotice('这个点已经撤下了。');
      retry();
    } catch (cause) { setNotice(cause.message); }
  };

  const shown = displayRecord(records, account);
  const you = field?.you || null;
  const archetype = you?.archetype || recordArchetype(shown)?.title || '';
  const total = field?.total || 0;
  const completed = field?.completed || 0;
  const tendency = axisTendency(you);
  const leaning = tendency
    ? [tendency.x, tendency.y]
      .map((side, index) => side && `偏${PROJECTION_AXIS_COPY[index === 0 ? 'x' : 'y'][side]}`)
      .filter(Boolean)
      .join(' · ')
    : '';

  const status = (() => {
    if (error) return error;
    if (!field) return '正在读这一片…';
    if (total === 0) return '场上还没有人。';
    if (total === 1 && you) return '场上只有你一个点。';
    return `现在场上有 ${total} 个点。`;
  })();

  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      <main className="relative z-10 h-[100svh] w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <header className="sticky top-0 z-30 bg-blur-bg/92 md:bg-blur-bg/70 md:backdrop-blur-md">
          <div className="relative flex h-16 items-center justify-between border-b border-blur-border/25 px-5 md:px-10">
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full glass transition-colors cursor-pointer hover:bg-blur-surface-hover"
              aria-label="返回"
            >
              <ArrowLeft size={16} className="text-blur-text-muted" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[11.5px] tracking-[0.42em] text-blur-text-muted">
              星图
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-blur-accent/60" aria-hidden="true" />
          </div>
        </header>

        <section className="relative mx-auto w-full max-w-5xl px-5 pt-8 md:px-10 md:pt-14">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[0.86fr_1.14fr] md:items-center md:gap-10">
            <Reveal>
              <Eyebrow>COMMUNITY / 只读</Eyebrow>
              <div className="relative mt-6 md:mt-8">
                <ChromaticTitle className={TITLE_CLASS} ghost={<TitleLines />}>
                  <TitleLines highlighted />
                </ChromaticTitle>
              </div>
              <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-blur-text md:text-[16px]">
                没有名字，点不开。你只能看见密度，和自己在其中的位置。
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative">
                <div className="mb-1.5 flex items-center justify-between text-[10px] tracking-[0.26em] text-blur-text-muted">
                  <span>STAR FIELD / 星图</span>
                  <span className="hidden sm:inline">移动指针，靠近看</span>
                </div>
                {/* 星图是一块观测场，不是放进卡片里的图表：
                    桌面端向右探进页边距；移动端收在栏内，避免把正文撑出屏幕。 */}
                <div className="relative h-[56svh] min-h-[330px] w-full md:-mr-10 md:h-[min(64svh,600px)] md:w-[calc(100%_+_2.5rem)]">
                  <CommunityField points={field?.points || []} you={you ? [you.x, you.y] : null} className="absolute inset-0" />
                  {/* 空场不放任何虚构的点，只放一句话。人少是早期，不是故障。 */}
                  {field && total === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                      <p className="text-[13px] tracking-[0.2em] text-blur-text-muted">这里还是空的</p>
                      <p className="text-[12px] text-blur-text-light">第一个点，可以是你</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-blur-border/30 pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <p className="text-[13px] leading-[1.7] text-blur-text/85" role="status">{status}</p>
                    {error ? (
                      <button onClick={retry} className="inline-flex items-center gap-1.5 text-[12.5px] text-blur-text-muted transition-colors hover:text-blur-text">
                        再读一次<RefreshCw size={12} />
                      </button>
                    ) : localPoint ? (
                      <button onClick={withdraw} className="text-[12px] text-blur-text-muted transition-colors hover:text-blur-text">
                        撤下我留下的点
                      </button>
                    ) : (
                      <span className="text-[11px] tracking-[0.2em] text-blur-text-muted">位置是近似的</span>
                    )}
                  </div>
                  {notice && <p className="mt-2 text-[12.5px] text-blur-text-muted" role="status">{notice}</p>}

                  {you ? (
                    <div className="mt-5 md:mt-6">
                      <div className="text-[10px] tracking-[0.28em] text-blur-text-muted">你的位置 / POSITION</div>
                      <p className="mt-2 text-[19px] leading-[1.5] text-blur-text md:text-[22px]">
                        {archetype ? `你的画像最接近「${archetype}」` : '你已经在这张图上了'}
                      </p>
                      {leaning && (
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-blur-text/80 md:text-[14px]">
                          在这张图上，你{leaning}。
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 max-w-md md:mt-6">
                      <p className="text-[14.5px] leading-[1.8] text-blur-text/90 md:text-[15px]">
                        做一次测试，你就会在这张图上留下一个点——不用注册，也不用把画像展示出来。
                      </p>
                      <div className="mt-4">
                        <GlassButton onClick={onStart} className="inline-flex items-center gap-2">
                          开始测试
                          <ArrowRight size={14} />
                        </GlassButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl">
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <SectionTag index="01" label="看得见，和看不见" />
            </Reveal>
            <Reveal delay={0.06} className="mt-6 grid gap-8 border-t border-blur-border/25 pt-6 md:grid-cols-2 md:gap-14">
              <div>
                <h3 className="text-[13px] tracking-[0.18em] text-blur-text/85">看得见</h3>
                <ul className="mt-3 space-y-2">
                  {SEEN.map((item) => (
                    <li key={item} className="text-[14.5px] leading-relaxed text-blur-text md:text-[15px]">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] tracking-[0.18em] text-blur-text-muted">看不见</h3>
                <ul className="mt-3 space-y-2">
                  {UNSEEN.map((item) => (
                    <li key={item} className="text-[14.5px] leading-relaxed text-blur-text/60 md:text-[15px]">{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.04} className="mt-8 max-w-2xl">
              <div className="border-l border-blur-accent/35 pl-5">
                <p className="text-[13.5px] leading-[1.8] text-blur-text/75 md:text-[14px]">
                  点与点之间的距离，是两份画像的相似度。但这张图只保留了大约七成的差异，
                  所以靠得近不代表真的像——位置是近似，不是结论。
                </p>
              </div>
            </Reveal>
          </section>

          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <SectionTag index="02" label="怎么让这里多一个人" />
              <h2 className="mt-4 text-[22px] font-medium tracking-[0.03em] text-blur-text md:text-[26px]">
                做完测试，你就已经在这里了。
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-[1.85] text-blur-text/85 md:text-[16px]">
                图上的人有两种来源：做完测试留下的匿名点——不用注册，也不用把画像存到云端；
                以及主动展示画像的人。两种都没有名字，也都点不开。
              </p>
              <p className="mt-3 max-w-2xl text-[15px] leading-[1.85] text-blur-text/85 md:text-[16px]">
                {completed > 0
                  ? `到目前有 ${completed} 个人做完过这个测试。这张图会跟着它慢慢变密。`
                  : '这张图会随着做完测试的人变密。'}
              </p>
            </Reveal>
            <Reveal delay={0.08} className="mt-8 flex flex-wrap items-center gap-4">
              <GlassButton size="lg" onClick={onOpenMy}>邀请一个朋友<ArrowRight size={15} /></GlassButton>
              <button onClick={onStart} className="inline-flex items-center gap-1.5 text-[13.5px] text-blur-text-muted transition-colors hover:text-blur-text">
                自己再测一次<ArrowUpRight size={13} />
              </button>
            </Reveal>
            <Reveal delay={0.04} className="mt-6 max-w-2xl">
              <p className="text-[12.5px] leading-[1.8] text-blur-text-muted">
                匿名点没有身份可查，所以只能在这台设备上撤下。换了浏览器或清掉本机数据之后，
                那个点还在图上，但再也找不到它——这是匿名的代价，不是故障。
              </p>
            </Reveal>
          </section>

          <section className="px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-2 text-center md:px-10">
            <Reveal>
              <button onClick={onOpenNext} className="text-[12.5px] text-blur-text-muted transition-colors hover:text-blur-text">
                为什么是这一片 →
              </button>
              <p className="mt-4 text-[11px] leading-relaxed text-blur-text-muted">
                毛玻璃 · 星图
                <br />
                没有名字的点，也是一个人
              </p>
            </Reveal>
          </section>
        </div>
      </main>
    </div>
  );
}
