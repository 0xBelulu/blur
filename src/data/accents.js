/**
 * 主色（accent）
 *
 * 两层模型：
 * - 信息层 = 原型色（archetypeProfiles 的 color），历史记录、完整画像用，不可改。
 * - 表达层 = 主色，头像与空间光场用，默认跟随当前展示画像。
 *
 * 色板不沿用原型色：10 个原型色两两平均 ΔE 只有 19.5，压进 59px 的头像后
 * 多数落到 2–5，肉眼分不出来。这里重新取色，约束是任意两色 ΔE ≥ 14。
 *
 * 命名沿用原型的语汇（雾、底片、剪影、潮汐那一路：摄影与材料的意象），
 * 不用「天青」「藕紫」「宣白」这类传统色名——那是另一种文艺风，不是这个产品的。
 * scripts/unit-tests.js 有对应的守卫，改色会直接失败。
 */

export const FOLLOW = 'follow';

export const DEFAULT_INK = [180, 185, 195];

export const ACCENTS = [
  { key: 'mist', name: '雾面', rgb: [178, 184, 196] },
  { key: 'sand', name: '暖沙', rgb: [203, 181, 146] },
  { key: 'clay', name: '陶土', rgb: [196, 143, 119] },
  { key: 'sky', name: '晴空', rgb: [139, 180, 212] },
  { key: 'deep', name: '深海', rgb: [98, 120, 152] },
  { key: 'lilac', name: '丁香', rgb: [176, 148, 188] },
  { key: 'lake', name: '湖水', rgb: [96, 142, 136] },
  { key: 'charcoal', name: '炭灰', rgb: [108, 108, 114] },
];

// 服务端白名单也读这个数组，避免前后端各维护一份。
export const ACCENT_KEYS = [FOLLOW, ...ACCENTS.map((accent) => accent.key)];

export function accentByKey(key) {
  return ACCENTS.find((accent) => accent.key === key) || null;
}

/**
 * 没有选择时跟随画像；选了就用选的；未知值（老数据、被下线的色）回退原型色。
 * 纯函数，不读 localStorage，方便单测。
 */
export function resolveAccent(account, profile) {
  return accentByKey(account?.accent)?.rgb || profile?.color || DEFAULT_INK;
}

/** 设置页与预览卡上那行「主色 · …」的文案。 */
export function accentSummary(account, profile) {
  const picked = accentByKey(account?.accent);
  if (picked) return picked.name;
  return profile?.title ? `跟随画像（${profile.title}）` : '跟随画像';
}

/**
 * 好友载荷（/api/people/*、/api/friends）里的主色。
 * palette 只在对方画像对你好友可见时才会下发，用来还原「跟随画像」的那个颜色。
 */
export function personAccent(person, profile) {
  const palette = Array.isArray(person?.palette) && person.palette.length === 3 ? { color: person.palette } : profile;
  return resolveAccent(person, palette);
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function shiftColor(rgb, factor, offset = 0) {
  return rgb.map((channel) => clamp(channel * factor + offset));
}

function rgbToHsl([r, g, b]) {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === red) h = (green - blue) / d + (green < blue ? 6 : 0);
  else if (max === green) h = (blue - red) / d + 2;
  else h = (red - green) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) { const value = clamp(l * 255); return [value, value, value]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    const hue = (t + 1) % 1;
    if (hue < 1 / 6) return p + (q - p) * 6 * hue;
    if (hue < 1 / 2) return q;
    if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)].map((v) => clamp(v * 255));
}

/**
 * 补色：光场之所以好看，是因为冷底压了一块暖色（实测两者相差 169°）。
 * 头像沿用同一构造，所以这里按主色算补色，而不是再写死一个暖沙。
 * 饱和度收一点、明度提一点，避免在 59px 里显得脏。
 */
export function complementOf(rgb) {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([(h + 0.5) % 1, Math.min(1, s * 0.85), Math.min(1, l + 0.06)]);
}

function towardWhite(rgb, amount) {
  return rgb.map((channel) => clamp(channel + (255 - channel) * amount));
}

/**
 * 头像的四个色标：主色、提亮、压暗、补色。
 * 和 `.pp-wash` 用的是同一套构造（一层径向渐变 + 模糊），只是尺寸小。
 */
export function markShades(rgb = DEFAULT_INK) {
  return {
    ink: rgb.join(','),
    light: towardWhite(rgb, 0.45).join(','),
    dark: shiftColor(rgb, 0.82).join(','),
    counter: complementOf(rgb).join(','),
  };
}
