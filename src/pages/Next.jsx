import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

/* 问卷入口。留空时页面依然完整，只是显示「准备中」而不是一个点不开的链接。 */
const SURVEY_URL = "";

const EASE = [0.22, 1, 0.36, 1];
const TITLE_CLASS = "text-[2.2rem] leading-[1.12] tracking-tight font-medium md:text-[3.6rem]";

const LAYERS = [
  { id: "L0", name: "一个人", note: "做完测试，你有了一个坐标", status: "已经有了", action: "start" },
  { id: "L1", name: "两个人", note: "把画像发给一个人，两张并排", status: "现在就可以", action: "my" },
  { id: "L2", name: "所有人", note: "每份愿意公开的画像，成为场上一个点", status: "还没开放", action: null },
];

/* 固定种子：每次刷新星场形状一致，不会跳。 */
function makeField() {
  let seed = 20261019;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const clusters = [
    [34, 36, 24, 30],
    [68, 26, 20, 24],
    [50, 70, 24, 26],
    [17, 72, 15, 12],
    [82, 60, 14, 10],
  ];
  const palette = [
    "rgba(155,142,199,",
    "rgba(143,181,196,",
    "rgba(196,165,137,",
    "rgba(196,155,165,",
  ];

  const dots = [];
  clusters.forEach(([cx, cy, spread, count], clusterIndex) => {
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * spread;
      const near = 1 - radius / (spread * 1.25);
      const color = palette[(clusterIndex + i) % palette.length];
      dots.push({
        x: Math.min(97, Math.max(3, cx + Math.cos(angle) * radius * 1.4)),
        y: Math.min(97, Math.max(3, cy + Math.sin(angle) * radius)),
        size: 5 + rand() * 7 + near * 4,
        alpha: 0.18 + rand() * 0.3 + near * 0.16,
        color,
        duration: 14 + rand() * 18,
        delay: rand() * 9,
        drift: i % 3 === 0,
      });
    }
  });
  return dots;
}

// 星场是确定性的，算一次就够，不参与渲染周期。
const FIELD = makeField();

function Reveal({ delay = 0, className = "", children }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
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

/* ─── 星场：一个亮起来的你，和一片没有名字的点 ─── */
function StarField() {
  const reduceMotion = useReducedMotion();
  const dots = FIELD;

  return (
    <div>
      <div className="relative h-[300px] overflow-hidden sm:h-[380px] md:h-[440px]">
      <div className="absolute inset-0" aria-hidden="true">
        {dots.map((dot, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              background: `radial-gradient(circle, ${dot.color}${dot.alpha}) 0%, ${dot.color}0) 70%)`,
              animation:
                reduceMotion || !dot.drift
                  ? "none"
                  : `drift ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
            }}
          />
        ))}

        {/* 你自己的那个点 */}
        <span
          className="absolute rounded-full"
          style={{
            left: "57%",
            top: "47%",
            width: "38px",
            height: "38px",
            transform: "translate(-50%, -50%)",
            border: "0.5px solid rgba(155,142,199,0.32)",
            animation: reduceMotion ? "none" : "pulse-glow 6s ease-in-out infinite",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            left: "57%",
            top: "47%",
            width: "72px",
            height: "72px",
            transform: "translate(-50%, -50%)",
            border: "0.5px solid rgba(155,142,199,0.14)",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            left: "57%",
            top: "47%",
            width: "8px",
            height: "8px",
            transform: "translate(-50%, -50%)",
            background: "rgba(74,69,64,0.88)",
            boxShadow: "0 0 14px rgba(155,142,199,0.85), 0 0 34px rgba(155,142,199,0.4)",
          }}
        />
      </div>

      <div className="pointer-events-none absolute left-0 top-0 text-[10px] tracking-[0.26em] text-blur-text-light">
        构想示意 · 非真实数据
      </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-6 border-t border-blur-border/25 pt-4">
        <p className="max-w-sm text-[12px] leading-relaxed text-blur-text/75">
          亮一点的那个点是你。其余的点没有名字，你只会感觉到它们的密度。
        </p>
        <span className="hidden shrink-0 text-[10px] tracking-[0.24em] text-blur-text-light sm:block">
          近似位置
        </span>
      </div>
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
        <header className="sticky top-0 z-30 bg-blur-bg/80 backdrop-blur-md">
          <div className="relative flex h-16 items-center justify-between border-b border-blur-border/25 px-5 md:px-10">
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full glass transition-colors cursor-pointer hover:bg-blur-surface-hover"
              aria-label="返回"
            >
              <ArrowLeft size={16} className="text-blur-text-muted" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[11px] tracking-[0.42em] text-blur-text-muted">
              下一步
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-blur-accent/60" aria-hidden="true" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl">
          {/* ═══ Hero ═══ */}
          <section className="px-5 pt-12 pb-10 md:px-10 md:pt-16">
            <Reveal>
              <div className="flex items-center gap-3 text-[10px] tracking-[0.32em] text-blur-text/75">
                <span className="h-px w-6 bg-blur-border/60" />
                <span>WHAT&apos;S NEXT / 未完成</span>
              </div>

              <h1 className={`${TITLE_CLASS} mt-6 text-blur-text md:mt-8`}>
                一片还没亮起来的
                <br />
                <span className="font-light italic text-blur-text/75">夜空</span>
              </h1>

              <p className="mt-6 max-w-md text-[13.5px] leading-[1.95] text-blur-text/85 md:text-[14px]">
                做完测试之后，Blur 要去哪，我们还没定。
              </p>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-[1.95] text-blur-text/80 md:text-[14px]">
                以下是我们的一个答案，不是唯一的答案。
              </p>
            </Reveal>

            <Reveal delay={0.12} className="mt-10 md:mt-12">
              <StarField />
            </Reveal>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 三层 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <div className="text-[10px] tracking-[0.28em] text-blur-text/75">现在已经走到哪</div>
              <p className="mt-3 max-w-md text-[13px] leading-[1.9] text-blur-text/80">
                这件事有三个层。只有前两层是真的，第三层还是我们想做的。
              </p>
            </Reveal>

            <Reveal delay={0.08} className="mt-6">
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
                      <span className="w-6 shrink-0 text-[11px] tracking-[0.1em] text-blur-text-light">
                        {layer.id}
                      </span>
                      <span
                        className={`w-12 shrink-0 text-[14px] tracking-[0.16em] transition-colors duration-500 md:w-14 ${
                          live ? "text-blur-text group-hover:text-blur-accent" : "text-blur-text-light"
                        }`}
                      >
                        {layer.name}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[12.5px] leading-relaxed ${
                          live ? "text-blur-text/70" : "text-blur-text-light"
                        }`}
                      >
                        {layer.note}
                      </span>
                      <span className="shrink-0 text-[11px] text-blur-text-muted">{layer.status}</span>
                      {live && (
                        <ArrowUpRight
                          size={11}
                          className="shrink-0 text-blur-text-light transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      )}
                    </Tag>
                  );
                })}
              </div>
            </Reveal>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 为什么是夜空 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <div className="text-[10px] tracking-[0.28em] text-blur-text/75">为什么是这一片</div>
            </Reveal>

            <Reveal delay={0.08} className="mt-5 space-y-5">
              <p className="text-[14px] leading-[1.9] text-blur-text/80 md:text-[15px]">
                我们不想做一个让人说话的地方。发言、关注、点赞，这些东西最后都会变成义务——你得在场，得回应，得维持一个形象。
              </p>
              <p className="text-[14px] leading-[1.9] text-blur-text/80 md:text-[15px]">
                我们想做的只是参照：让你看见自己在人群里的位置。看得见密度，看不清是谁。
              </p>
              <p className="text-[14px] leading-[1.9] text-blur-text/80 md:text-[15px]">
                所以它应该是模糊的。这不是视觉风格，是产品规则。
              </p>
            </Reveal>

            <Reveal delay={0.05} className="mt-8">
              <div className="border-l border-blur-border/40 pl-5">
                <p className="text-[13px] leading-[1.9] text-blur-text-muted">
                  我们还想过另外两条路：把双人对比做得更深，或者让每个人匿名写一段自己的话。第一条不够像一个地方，第二条会把审核义务重新带回来。所以暂时选了这一条。
                </p>
              </div>
            </Reveal>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 转折 + 问卷 ═══ */}
          <section className="px-5 py-12 md:px-10 md:py-16">
            <Reveal>
              <div className="text-[10px] tracking-[0.28em] text-blur-text/75">但这只是我们的答案</div>
              <h2 className="mt-3 text-xl font-medium tracking-[0.04em] text-blur-text md:text-[22px]">
                这一页会有第二版。
              </h2>
              <p className="mt-3 max-w-md text-[13.5px] leading-[1.9] text-blur-text/80">
                也许你想要的不是一片夜空，也许这个方向根本不成立。第二版长什么样，取决于接下来收到的回答。
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-8">
              {SURVEY_URL ? (
                <a
                  href={SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl glass-strong px-8 text-sm font-medium tracking-wide text-blur-text transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.96]"
                >
                  告诉我们你想要什么
                  <ArrowUpRight size={14} />
                </a>
              ) : (
                <span className="inline-flex min-h-12 cursor-not-allowed items-center rounded-2xl glass px-8 text-sm font-medium tracking-wide text-blur-text-muted/70">
                  问卷正在准备中
                </span>
              )}
              <p className="mt-4 text-[11px] leading-relaxed text-blur-text-muted">
                {SURVEY_URL
                  ? "五个问题，一分半。会跳转到外部问卷，那边不受 Blur 的匿名保护。"
                  : "五个问题，一分半。入口上线后出现在这里。"}
              </p>
            </Reveal>
          </section>

          <section className="px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 text-center md:px-10">
            <Reveal>
              <p className="text-[10px] leading-relaxed text-blur-text-muted/90">
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
