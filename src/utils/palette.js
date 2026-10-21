/**
 * 环境色（ambient palette）—— 界面、光场、图表共用的那一套颜色。
 *
 * 为什么单独抽一个文件：这套 4 色原先以字面量散落在 11 个文件、36 处
 * （`rgba(155,142,199,0.3)` 这种写法），改一次主色要改 36 遍，漏一处就会出现
 * 「按钮已经是新的、光场还是旧的」的割裂。index.css 的 @theme 是它的 CSS 镜像，
 * 两边必须同步（那边只能写字面量，Tailwind 不接受表达式）。
 *
 * 与另外两层颜色的分工：
 * - 信息层 = archetypeProfiles.color（10 个原型色），不可改。
 * - 用户可选层 = shared/accents.js 的 8 色板，由 ΔE ≥ 14 的测试守卫。
 * - 表达层 = 这里。只描述界面的气氛，不参与人格识别。
 *
 * 取值来自一张 AI 生成的海报。相对旧值只做了两件事：
 * 主色蓝 20°（h254 → h234），四色的明度从「全挤在 L65–69」拉开到 19/57/63/69/75/96。
 * 后者才是画面不再发糊的原因——色相接近，但层级出来了。
 */

export const INK = [51, 50, 47]; // #33322f 墨：标题与正文
export const PAPER = [248, 245, 241]; // #f8f5f1 底：暖奶油
export const ACCENT = [124, 133, 196]; // #7c85c4 主色：夜蓝紫
export const SKY = [142, 163, 210]; // #8ea3d2 冷：天蓝
export const GOLD = [232, 205, 151]; // #e8cd97 暖：奶油金
export const DEEP = [107, 116, 184]; // #6b74b8 副色：深一档的蓝紫

/** 主色作文字时对比度不足（#7c85c4 on #f8f5f1 只有 3.2），需要 4.5 时用这一档。 */
export const ACCENT_INK = [95, 104, 173]; // #5f68ad

/** 次级文字两档，和 --color-blur-text-muted / -light 对齐。 */
export const MUTED = [117, 115, 108]; // #75736c
export const HINT = [168, 164, 155]; // #a8a49b

export function rgba(rgb, alpha) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

export function hex(rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
