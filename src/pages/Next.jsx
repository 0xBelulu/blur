import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

/* 问卷入口。留空时页面依然完整，只是显示「准备中」而不是一个点不开的链接。 */
const SURVEY_URL = "https://v.wjx.cn/vm/htOh3D6.aspx#";

const EASE = [0.22, 1, 0.36, 1];
const TITLE_CLASS = "text-[2.3rem] leading-[1.1] tracking-tight font-medium md:text-[3.6rem]";

/* 中文没有真正的斜体，浏览器合成出来的倾斜版本像排版事故。
   两行标题的对比改用字重和明度，不用斜体。 */
function TitleLines({ highlighted = false }) {
  return (
    <>
      一片还没亮起来的
      <br />
      <span className={highlighted ? "font-light text-blur-text/70" : "font-light"}>夜空</span>
    </>
  );
}

const LAYERS = [
  { id: "L0", name: "一个人", note: "做完测试，你有了一个坐标", status: "已经有了", action: "start" },
  { id: "L1", name: "两个人", note: "把画像发给一个人，两张并排", status: "现在就可以", action: "my" },
  { id: "L2", name: "所有人", note: "每份愿意公开的画像，成为场上一个点", status: "还没开放", action: null },
];

function Reveal({ delay = 0, className = "", children }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      // 和 About 页完全一致的入场参数。
      // filter 不是浏览器可加速的属性，framer-motion 只能用主线程逐帧插值，
      // 所以它能不能跑顺，取决于同一帧里还有谁在抢主线程。
      initial={reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(7px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.95, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── 章节标记：编号 + 小注 + 一条通到右缘的细线 ─── */
function SectionTag({ index, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] tabular-nums tracking-[0.1em] text-blur-text-muted">{index}</span>
      <span className="text-[11px] tracking-[0.24em] text-blur-text/85">{label}</span>
      <span className="h-px flex-1 bg-blur-border/45" />
    </div>
  );
}

export default function Next({ onBack, onStart, onOpenMy }) {
  const handleLayer = (action) => {
    if (action === "start") onStart();
    else if (action === "my") onOpenMy();
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      <main className="relative z-10 h-[100svh] w-full overflow-y-auto custom-scrollbar">
        {/* 手机端不要 backdrop-blur：头部下面是逐帧刷新的星场，
            每帧重新采样一次背景模糊，安卓上非常贵 */}
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
              下一步
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-blur-accent/60" aria-hidden="true" />
          </div>
        </header>

        {/* ═══ Hero：左侧标题压在一侧，右侧文字下坠，和主页同一个构图逻辑 ═══ */}
        <section className="relative">
          <div className="mx-auto w-full max-w-5xl px-5 pt-14 pb-10 md:px-10 md:pt-24 md:pb-14">
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-14">
              <Reveal>
                <div className="flex items-center gap-3 text-[11px] tracking-[0.32em] text-blur-text/85">
                  <span className="h-px w-6 bg-blur-border/60" />
                  <span>WHAT&apos;S NEXT / 未完成</span>
                </div>

                <div className="relative mt-6 md:mt-8">
                  <span
                    aria-hidden="true"
                    className={`${TITLE_CLASS} pointer-events-none absolute inset-0 select-none text-blur-accent/25 blur-[16px]`}
                  >
                    <TitleLines />
                  </span>
                  <span
                    aria-hidden="true"
                    className={`${TITLE_CLASS} pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[2px] select-none text-blur-accent-cool/25 blur-[5px]`}
                  >
                    <TitleLines />
                  </span>
                  <h1 className={`${TITLE_CLASS} relative text-blur-text`}>
                    <TitleLines highlighted />
                  </h1>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="max-w-md text-[15px] leading-[1.8] text-blur-text md:text-[16px]">
                  做完测试之后，Blur 要去哪，我们还没定。
                </p>
                <p className="mt-2 max-w-md text-[15px] leading-[1.8] text-blur-text/85 md:text-[16px]">
                  以下是我们的一个答案，不是唯一的答案。
                </p>
              </Reveal>
            </div>

            {/* 这一行横贯整栏，给上面两列一个落点，也把 hero 收住 */}
            <Reveal delay={0.2} className="mt-10 md:mt-14">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-blur-border/30 pt-4">
                <p className="max-w-xl text-[13px] leading-[1.75] text-blur-text/85">
                  光落在哪里，哪里才清晰。其余的点没有名字，你只能感觉到它们的密度。
                </p>
                <span className="text-[11px] tracking-[0.2em] text-blur-text-muted">
                  构想示意 · 非真实数据
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl">
          {/* ═══ 01 三层 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <SectionTag index="01" label="现在已经走到哪" />
            </Reveal>
            <Reveal delay={0.06} className="mt-4">
              <p className="max-w-2xl text-[15px] leading-[1.8] text-blur-text/90 md:text-[16px]">
                这件事有三个层。只有前两层是真的，第三层还是我们想做的。
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-6">
              <div className="border-t border-blur-border/25">
                {LAYERS.map((layer) => {
                  const live = Boolean(layer.action);
                  const Tag = live ? "button" : "div";
                  return (
                    <Tag
                      key={layer.id}
                      onClick={live ? () => handleLayer(layer.action) : undefined}
                      className={`group flex w-full items-center gap-3 border-b border-blur-border/25 py-4 text-left transition-colors duration-500 md:gap-5 ${
                        live ? "cursor-pointer hover:border-blur-border/45" : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 text-[11.5px] tracking-[0.1em] text-blur-text-muted">
                        {layer.id}
                      </span>
                      <span
                        className={`w-14 shrink-0 text-[15px] tracking-[0.14em] transition-colors duration-500 md:w-16 ${
                          live ? "text-blur-text group-hover:text-blur-accent" : "text-blur-text-muted"
                        }`}
                      >
                        {layer.name}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[13.5px] leading-relaxed md:text-[14px] ${
                          live ? "text-blur-text/85" : "text-blur-text/60"
                        }`}
                      >
                        {layer.note}
                      </span>
                      <span className="shrink-0 text-[12px] text-blur-text/70">{layer.status}</span>
                      {live && (
                        <ArrowUpRight
                          size={12}
                          className="shrink-0 text-blur-text-light transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      )}
                    </Tag>
                  );
                })}
              </div>
            </Reveal>
          </section>

          {/* ═══ 02 为什么是这一片 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <SectionTag index="02" label="为什么是这一片" />
            </Reveal>

            <Reveal delay={0.08} className="mt-5 max-w-2xl space-y-6">
              <p className="text-[15px] leading-[1.85] text-blur-text/90 md:text-[16px]">
                我们不想做一个让人说话的地方。发言、关注、点赞，这些东西最后都会变成义务——你得在场，得回应，得维持一个形象。
              </p>
              <p className="text-[15px] leading-[1.85] text-blur-text/90 md:text-[16px]">
                我们想做的只是参照：让你看见自己在人群里的位置。看得见密度，看不清是谁。
              </p>
              <p className="text-[15px] leading-[1.85] text-blur-text md:text-[16px]">
                所以它应该是模糊的。这不是视觉风格，是产品规则。
              </p>
            </Reveal>

            <Reveal delay={0.05} className="mt-9 max-w-2xl">
              <div className="border-l border-blur-accent/35 pl-5">
                <p className="text-[13.5px] leading-[1.8] text-blur-text/75 md:text-[14px]">
                  我们还想过另外两条路：把双人对比做得更深，或者让每个人匿名写一段自己的话。第一条不够像一个地方，第二条会把审核义务重新带回来。所以暂时选了这一条。
                </p>
              </div>
            </Reveal>
          </section>

          {/* ═══ 03 转折 + 问卷 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <SectionTag index="03" label="但这只是我们的答案" />
              <h2 className="mt-4 text-[22px] font-medium tracking-[0.03em] text-blur-text md:text-[26px]">
                这一页会有第二版。
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-[1.85] text-blur-text/85 md:text-[16px]">
                也许你想要的不是一片夜空，也许这个方向根本不成立。第二版长什么样，取决于接下来收到的回答。
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-8">
              {SURVEY_URL ? (
                <a
                  href={SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-13 items-center gap-2 rounded-2xl glass-strong px-8 text-[15px] font-medium tracking-wide text-blur-text transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.96]"
                >
                  告诉我们你想要什么
                  <ArrowUpRight size={15} />
                </a>
              ) : (
                <span className="inline-flex min-h-13 cursor-not-allowed items-center rounded-2xl glass px-8 text-[15px] font-medium tracking-wide text-blur-text-muted/70">
                  问卷正在准备中
                </span>
              )}
              <p className="mt-4 text-[12.5px] leading-relaxed text-blur-text/70">
                {SURVEY_URL
                  ? "五个问题，一分半。会跳转到外部问卷，那边不受 Blur 的匿名保护。"
                  : "五个问题，一分半。入口上线后出现在这里。"}
              </p>
            </Reveal>
          </section>

          <section className="px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 text-center md:px-10">
            <Reveal>
              <p className="text-[11px] leading-relaxed text-blur-text-muted">
                Blur · 下一步
                <br />
                它不是一份路线图，是一个还没决定的问题
              </p>
            </Reveal>
          </section>
        </div>
      </main>
    </div>
  );
}
