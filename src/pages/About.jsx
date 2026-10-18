import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Hash, List, Sparkles } from "lucide-react";
import GlassButton from "../components/GlassButton";
import OpticalStage from "../components/optical/OpticalStage";
import { ABOUT_PRESET } from "../components/optical/presets";
import { ARCHETYPE_SYMBOLS } from "../data/archetypeField";
import { archetypeDescriptions, tagPool } from "../data/tags";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles";

const EASE = [0.22, 1, 0.36, 1];
const TITLE_CLASS = "text-[3.1rem] leading-[1.04] md:text-[5.4rem] tracking-tight font-medium";

/* 章节入场：从失焦到聚焦 */
function useReveal() {
  const reduceMotion = useReducedMotion();
  return (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(7px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, margin: "-10% 0px -10% 0px" },
    transition: { duration: 0.95, delay, ease: EASE },
  });
}

/* ─── 镜头刻度：页面自己的视觉签名 ─── */
function ApertureMark({ className = "" }) {
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="86" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 7" opacity="0.5" />
      <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <circle cx="100" cy="100" r="42" stroke="currentColor" strokeWidth="0.5" strokeDasharray="18 5" opacity="0.45" />
      {ticks.map((deg) => (
        <line
          key={deg}
          x1="100" y1="12" x2="100" y2={deg % 45 === 0 ? 24 : 19}
          stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
    </svg>
  );
}

/* ─── 漂浮对焦场：复用共享光学引擎，只负责读数 ─── */
function FocusField({ onOpen }) {
  const [focused, setFocused] = useState(null);
  const profile = focused ? archetypeDescriptions[focused.id] : null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-[10px] tracking-[0.28em] text-blur-text/75">
        <span>10 PROTOTYPES</span>
        <span className="hidden sm:inline">HOVER / TAP TO FOCUS</span>
      </div>

      {/* 这一块就是整页共用的光学场：同一套弥散圆、视差、点按合焦，只是把容器缩到了这里 */}
      <div className="relative mt-1 h-[300px] sm:h-[330px] md:h-[360px]">
        <OpticalStage
          scope="container"
          preset={ABOUT_PRESET}
          symbols={ARCHETYPE_SYMBOLS}
          symbolClassName="text-[34px] md:text-[40px] lg:text-[44px]"
          onFocusChange={setFocused}
        />
      </div>

      {/* 读数：默认给一句提示，对焦时给出那一枚原型的自述 */}
      <div className="mt-2 flex min-h-[58px] items-start justify-between gap-4 border-t border-blur-border/25 pt-4">
        {profile ? (
          <div key={profile.title} className="glyph-swap min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[13px] tracking-[0.2em] text-blur-text">{profile.title}</span>
              <span className="text-[10px] tracking-[0.12em] text-blur-text/70">
                {ARCHETYPE_PROFILES[focused.id]?.roleBadge}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-blur-text/75">
              {profile.description}
            </p>
          </div>
        ) : (
          <div>
            <div className="text-[12px] text-blur-text/80">十种模糊的方式，正浮在这片空气里。</div>
            <p className="mt-1 text-[11px] text-blur-text/70">移动指针靠近，或者轻点任意一枚，让它清晰。</p>
          </div>
        )}
        <button
          onClick={onOpen}
          className="group mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[10px] tracking-[0.16em] text-blur-text-muted transition-colors hover:text-blur-text cursor-pointer"
        >
          查看全部原型
          <ArrowUpRight size={11} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── 章节标题：编号 + 英文小注 + 标题 ─── */
function SectionHead({ index, tag, title, lead }) {
  return (
    <div className="flex items-start gap-4 md:gap-8">
      {/* 左栏只留编号，英文小注移到标题上方，避免长单词压到正文 */}
      <div className="w-10 shrink-0 md:w-14">
        <div className="text-[28px] font-light leading-none tabular-nums text-blur-text-muted/90 md:text-[34px]">
          {index}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] tracking-[0.28em] text-blur-text/75">{tag}</div>
        <h2 className="mt-2.5 text-xl font-medium tracking-[0.06em] text-blur-text md:text-[22px]">{title}</h2>
        {lead && (
          <p className="mt-3 text-[14px] leading-[1.85] text-blur-text/80 md:text-[15px]">{lead}</p>
        )}
      </div>
    </div>
  );
}

/* ─── 文字式入口链接 ─── */
function MoreLink({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group mt-7 inline-flex items-center gap-2 text-[12.5px] tracking-[0.16em] text-blur-text/80 transition-colors duration-300 hover:text-blur-text cursor-pointer"
    >
      <Icon size={12} className="opacity-70" />
      <span className="relative">
        {label}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-blur-accent/60 transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </span>
      <ArrowUpRight
        size={12}
        className="opacity-60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </button>
  );
}

/* ─── 十种原型：像一份镜片目录，悬停时被自己的颜色照亮 ─── */
function ArchetypeIndex({ onOpen }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="mt-6 border-t border-blur-border/25" onMouseLeave={() => setHovered(null)}>
      {Object.entries(archetypeDescriptions).map(([key, item], index) => {
        const color = ARCHETYPE_PROFILES[key]?.color ?? [190, 185, 195];
        return (
          <button
            key={key}
            onClick={onOpen}
            onMouseEnter={() => setHovered(index)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            className="group relative flex w-full items-center gap-3 overflow-hidden border-b border-blur-border/25 py-4 pl-3 pr-2 text-left transition-colors duration-500 hover:border-blur-border/40 cursor-pointer md:gap-4"
            style={{
              filter: hovered !== null && hovered !== index ? "blur(1px)" : "none",
              opacity: hovered !== null && hovered !== index ? 0.5 : 1,
              transition: "filter 500ms ease, opacity 500ms ease, border-color 500ms ease",
            }}
          >
            {/* 对焦色晕：不是高亮块，是一团被虚化的散景，hover 才慢慢浮出来 */}
            <span
              className="pointer-events-none absolute -left-10 top-1/2 h-28 w-44 -translate-y-1/2 rounded-full opacity-0 blur-[26px] transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
              style={{
                background: `radial-gradient(circle at 40% 50%, rgba(${color.join(",")},0.85) 0%, rgba(${color.join(",")},0.32) 46%, transparent 72%)`,
              }}
              aria-hidden="true"
            />
            <span className="relative w-6 shrink-0 text-[14px] font-light tabular-nums tracking-[0.04em] text-blur-text/50 transition-colors duration-500 group-hover:text-blur-text/85">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="relative w-12 shrink-0 text-[15px] tracking-[0.18em] text-blur-text transition-all duration-500 group-hover:translate-x-0.5 group-hover:tracking-[0.26em] md:w-16">
              {item.title}
            </span>
            <span className="relative line-clamp-2 min-w-0 flex-1 text-[12.5px] leading-relaxed text-blur-text/70 blur-[0.5px] transition-all duration-500 group-hover:text-blur-text group-hover:blur-0 md:line-clamp-1">
              {item.subtitle}
            </span>
            <span className="relative shrink-0 text-base opacity-50 blur-[0.6px] transition-all duration-500 group-hover:scale-110 group-hover:opacity-100 group-hover:blur-0">
              {item.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── 特质碎片：指向哪枚，哪枚才清晰 ─── */
const FRAGMENT_BLUR = [0.6, 0, 0.9, 1.3, 0.3, 0.7, 1.6, 0.15];

function TraitFragments({ onOpen }) {
  const fragments = useMemo(
    () =>
      Object.entries(tagPool).map(([key, trait], index) => ({
        key,
        ...trait,
        blur: FRAGMENT_BLUR[index % FRAGMENT_BLUR.length],
        emphasized: trait.weight >= 1,
      })),
    []
  );
  const [active, setActive] = useState(null);

  return (
    <div>
      <div
        className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-3"
        onMouseLeave={() => setActive(null)}
      >
        {fragments.map((fragment) => {
          const isActive = active?.key === fragment.key;
          const dimmed = active !== null && !isActive;
          return (
            <button
              key={fragment.key}
              onClick={onOpen}
              onMouseEnter={() => setActive(fragment)}
              onFocus={() => setActive(fragment)}
              onBlur={() => setActive(null)}
              className="cursor-pointer transition-all duration-500 ease-out hover:text-blur-accent focus-visible:text-blur-accent focus-visible:outline-none"
              style={{
                fontSize: fragment.emphasized ? "17px" : "13px",
                letterSpacing: "0.04em",
                color: isActive ? undefined : fragment.emphasized ? "rgba(74,69,64,0.92)" : "rgba(74,69,64,0.72)",
                filter: `blur(${isActive ? 0 : dimmed ? 1.8 : fragment.blur}px)`,
                opacity: isActive ? 1 : dimmed ? 0.28 : 1,
              }}
            >
              {fragment.text}
            </button>
          );
        })}
      </div>

      <div className="mt-7 h-11 border-t border-blur-border/20 pt-3">
        {active ? (
          <p key={active.key} className="glyph-swap text-[12px] leading-relaxed text-blur-text-muted">
            <span className="text-blur-text">{active.text}</span>
            <span className="mx-1.5 text-blur-text-muted/70">—</span>
            {active.detail}
          </p>
        ) : (
          <p className="text-[12px] leading-relaxed text-blur-text/70 italic">
            把指针停在任意一枚碎片上，它会短暂地清晰。
          </p>
        )}
      </div>
    </div>
  );
}

export default function About({ onBack, onStart, onOpenArchetypes, onOpenTraits, onOpenQuestions }) {
  const reveal = useReveal();
  const progressRef = useRef(null);
  const aboutRef = useRef(null);
  const archetypesRef = useRef(null);
  const traitsRef = useRef(null);

  const handleScroll = (event) => {
    const el = event.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    const ratio = max > 0 ? el.scrollTop / max : 0;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
  };

  const jump = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      {/* 滚动容器铺满整个窗口：滚轮在屏幕任意位置都有效，滚动条也落在窗口右缘 */}
      <main className="relative z-10 h-[100svh] w-full overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
        {/* ── Header：吸顶，带阅读进度 ── */}
        <header className="sticky top-0 z-30 bg-blur-bg/80 backdrop-blur-md">
          <div className="relative flex h-16 items-center justify-between px-5 md:px-10">
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full glass transition-colors cursor-pointer hover:bg-blur-surface-hover"
              aria-label="返回"
            >
              <ArrowLeft size={16} className="text-blur-text-muted" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[11px] tracking-[0.42em] text-blur-text-muted">
              探索 BLUR
            </span>
            <ApertureMark className="h-7 w-7 text-blur-text-light/70" />
          </div>
          <div className="relative h-px w-full bg-blur-border/25">
            <div
              ref={progressRef}
              className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-gradient-to-r from-blur-accent/70 via-blur-accent-cool/70 to-blur-accent-warm/70"
            />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl">
          {/* ═══ Hero ═══ */}
          <section className="relative overflow-hidden px-5 pt-10 pb-12 md:px-10 md:pt-16 md:pb-16">
            <ApertureMark className="animate-slow-spin pointer-events-none absolute -right-16 top-2 h-64 w-64 text-blur-accent/40 md:-right-10 md:top-6 md:h-80 md:w-80" />

            <motion.div {...reveal(0)} className="relative">
              <div className="flex items-center gap-3 text-[10px] tracking-[0.32em] text-blur-text/75">
                <span className="h-px w-6 bg-blur-border/60" />
                <span>FIELD NOTES / 001</span>
              </div>

              <div className="relative mt-6 md:mt-8">
                <span aria-hidden="true" className={`${TITLE_CLASS} pointer-events-none absolute inset-0 select-none text-blur-accent/25 blur-[14px]`}>
                  探索 Blur
                </span>
                <span aria-hidden="true" className={`${TITLE_CLASS} pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[2px] select-none text-blur-accent-cool/25 blur-[4px]`}>
                  探索 Blur
                </span>
                <h1 className={`${TITLE_CLASS} relative text-blur-text`}>
                  探索 <span className="font-light italic text-blur-text/75">Blur</span>
                </h1>
              </div>

              <p className="mt-6 max-w-sm text-[13px] leading-[1.95] text-blur-text/85 md:mt-7 md:text-[14px]">
                一种不精确的人格测试，和它背后十种模糊的方式。
              </p>
              <p className="mt-1.5 max-w-sm text-[13px] leading-[1.95] text-blur-text/80 md:text-[14px]">
                这里没有正确答案，只有你还未看清的那部分自己。
              </p>

              <div className="mt-7 flex items-center gap-5 text-[10px] tracking-[0.2em] text-blur-text/75">
                <span>10 道题</span>
                <span className="h-2.5 w-px bg-blur-border/60" />
                <span>10 个维度</span>
                <span className="h-2.5 w-px bg-blur-border/60" />
                <span>约 3 分钟</span>
              </div>
            </motion.div>

            <motion.div {...reveal(0.15)} className="relative mt-10 md:mt-12">
              <FocusField onOpen={onOpenArchetypes} />
            </motion.div>

            {/* 章节目录 */}
            <motion.nav {...reveal(0.1)} className="relative mt-12 flex flex-wrap gap-2">
              {[
                { key: "about", index: "01", label: "关于" },
                { key: "archetypes", index: "02", label: "原型" },
                { key: "traits", index: "03", label: "特质" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => jump({ about: aboutRef, archetypes: archetypesRef, traits: traitsRef }[item.key])}
                  className="group inline-flex items-center gap-2 rounded-full border border-blur-border/40 bg-white/35 px-3.5 py-1.5 text-[11px] text-blur-text/85 backdrop-blur-sm transition-all duration-300 hover:border-blur-border/60 hover:bg-white/50 hover:text-blur-text cursor-pointer"
                >
                  <span className="text-[10px] tabular-nums tracking-[0.18em] text-blur-text-muted group-hover:text-blur-accent">
                    {item.index}
                  </span>
                  {item.label}
                </button>
              ))}
              <span className="ml-auto hidden items-center gap-2 text-[10px] tracking-[0.26em] text-blur-text-muted/90 sm:flex">
                向下
                <motion.span
                  animate={{ y: [0, 5, 0], opacity: [0.25, 0.8, 0.25] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="block h-1 w-1 rounded-full bg-blur-text-light"
                />
              </span>
            </motion.nav>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 01 关于 ═══ */}
          <section ref={aboutRef} className="scroll-mt-16 px-5 py-14 md:px-10 md:py-20">
            <motion.div {...reveal(0)}>
              <SectionHead
                index="01"
                tag="ABOUT"
                title="关于这个测试"
                lead="我们不给你贴标签，不打分，不排名。Blur 不是那种做完之后给你四个字母、一个百分比、或者一句「你是 X 型人格」的测试。"
              />
            </motion.div>

            <motion.blockquote
              {...reveal(0.1)}
              className="mt-9 border-l border-blur-accent/40 pl-5 md:ml-[88px] md:pl-6"
            >
              <p className="text-[17px] leading-[1.85] text-blur-text/85 md:text-lg">
                你越努力想看清自己，画面就越模糊。
              </p>
              <p className="mt-1 text-[13px] text-blur-text-muted italic">这不是 bug，这就是你。</p>
            </motion.blockquote>

            <motion.div {...reveal(0.15)} className="mt-8 space-y-5 pl-0 md:pl-[88px]">
              <p className="text-[14px] leading-[1.9] text-blur-text/80 md:text-[15px]">
                每道题都没有正确答案，除了你心里那个。我们的目的不是定义你，而是让你发现一个你从未注意到的自己。
              </p>
              <p className="text-[14px] leading-[1.9] text-blur-text/80 md:text-[15px]">
                你可能会在某一题停下来很久，也可能在某一题突然想笑。这两种反应都算答对了。
              </p>
            </motion.div>

            {/* 事情怎么发生 */}
            <motion.div {...reveal(0.1)} className="mt-10 md:pl-[88px]">
              <div className="flex items-center gap-3 text-[10px] tracking-[0.26em] text-blur-text/75">
                <span>它是怎么发生的</span>
                <span className="h-px flex-1 bg-blur-border/30" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5 md:gap-3">
                {[
                  { n: "10", label: "道题", sub: "凭第一反应作答", tint: "rgba(155,142,199,0.55)" },
                  { n: "10", label: "个维度", sub: "被悄悄测量", tint: "rgba(143,181,196,0.55)" },
                  { n: "01", label: "个你", sub: "无法被归类", tint: "rgba(196,165,137,0.55)" },
                ].map((step, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl border border-blur-border/25 bg-white/30 px-3 py-4 text-center backdrop-blur-sm transition-colors duration-500 hover:bg-white/50 md:px-4 md:py-5"
                  >
                    <span
                      className="pointer-events-none absolute -top-6 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                      style={{ backgroundColor: step.tint }}
                      aria-hidden="true"
                    />
                    <div className="relative text-2xl font-light tabular-nums text-blur-text md:text-[28px]">
                      {step.n}
                    </div>
                    <div className="relative mt-1 text-[11px] tracking-[0.16em] text-blur-text">
                      {step.label}
                    </div>
                    <div className="relative mt-1 text-[11px] text-blur-text/70">{step.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...reveal(0.05)} className="md:pl-[88px]">
              <MoreLink icon={List} label="先浏览全部题目" onClick={onOpenQuestions} />
            </motion.div>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 02 原型 ═══ */}
          <section ref={archetypesRef} className="scroll-mt-16 px-5 py-14 md:px-10 md:py-20">
            <motion.div {...reveal(0)}>
              <SectionHead
                index="02"
                tag="ARCHETYPES"
                title="十种模糊的原型"
                lead="它们不是分类，而是透镜——透过不同的模糊方式，你看到的是不同的自己。雾、风铃、暖流、晶体、虹、盐、底片、潮汐、剪影、纸鸢。"
              />
            </motion.div>

            <motion.div {...reveal(0.1)}>
              <ArchetypeIndex onOpen={onOpenArchetypes} />
            </motion.div>

            <motion.div {...reveal(0.05)} className="md:pl-[88px]">
              <MoreLink icon={Sparkles} label="查看全部原型详情" onClick={onOpenArchetypes} />
            </motion.div>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 03 特质 ═══ */}
          <section ref={traitsRef} className="scroll-mt-16 px-5 py-14 md:px-10 md:py-20">
            <motion.div {...reveal(0)}>
              <SectionHead
                index="03"
                tag="FRAGMENTS"
                title="五十余枚特质碎片"
                lead="单独看是碎片，组合起来才是一幅完整的画面。你的结果里只会出现最贴合你的几枚，其余则是你还没注意到的侧面。"
              />
            </motion.div>

            <motion.div {...reveal(0.1)}>
              <TraitFragments onOpen={onOpenTraits} />
            </motion.div>

            <motion.div {...reveal(0.05)} className="md:pl-[88px]">
              <MoreLink icon={Hash} label="查看全部特质标签" onClick={onOpenTraits} />
            </motion.div>
          </section>

          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-blur-border/50 to-transparent md:mx-10" />

          {/* ═══ 收尾 ═══ */}
          <section className="relative overflow-hidden px-5 pt-16 pb-20 text-center md:px-10 md:pt-24">
            <ApertureMark className="animate-slow-spin pointer-events-none absolute left-1/2 top-8 h-52 w-52 -translate-x-1/2 text-blur-accent-cool/30" />

            <motion.div {...reveal(0)} className="relative">
              <p className="text-[10px] tracking-[0.4em] text-blur-text-muted/90">READY WHEN YOU ARE</p>
              <h2 className="mt-6 text-[22px] font-medium leading-snug text-blur-text md:text-[28px]">
                现在，可以开始看不清了。
              </h2>
              <p className="mt-4 text-[13px] italic leading-relaxed text-blur-text-muted">
                十道题，三次深呼吸，一个还不确定的你。
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <GlassButton onClick={onStart} className="min-h-12 px-9 text-sm">
                  开始测试
                </GlassButton>
                <button
                  onClick={onOpenQuestions}
                  className="group inline-flex min-h-12 items-center gap-2 px-4 text-[12px] tracking-[0.18em] text-blur-text-muted transition-colors duration-300 hover:text-blur-text cursor-pointer"
                >
                  先看看题目
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              <p className="mt-16 text-[10px] leading-relaxed text-blur-text-muted/90">
                Blur · 一种不精确的人格测试
                <br />
                结果不具备任何科学参考价值，但可能意外地准确
              </p>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}
