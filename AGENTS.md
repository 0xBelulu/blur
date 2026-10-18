# Blur — Agent Instructions

## Stack
- React 19 + Vite 8 + Tailwind CSS v4 (plain `.jsx`, no TypeScript)
- Framer Motion (page transitions), lucide-react (icons)
- Tailwind v4: `@tailwindcss/vite` plugin, `@import "tailwindcss"` in CSS, no `tailwind.config.js`
- `@types/react` for editor intellisense only — do not add `.ts/.tsx` files

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint v10 (single command, no typecheck) |
| `npm test` | Automated unit & E2E verification test suite |
| `npm run preview` | Preview production build |
| `$env:LAN="0"; npm run dev` | Opt out of LAN debug. HTTPS + LAN is currently ON by default via `LAN_DEBUG_DEFAULT` in `vite.config.js` (temporary, for mobile gyro testing); `LAN=1` forces it on |

## Scripts (calibration & audit)
| Script | Purpose |
|--------|---------|
| `node scripts/balance-audit.js --trials 5000` | Monte Carlo 平衡性审计，检查各原型在随机回答下的胜率分布 |
| `node scripts/compute-baselines.js --trials 20000 --apply` | 随机基线校准，重算各原型的余弦相似度 μ/σ 并写入 blurEngine.js |
| `node scripts/analyze-exposure.js` | 分析维度暴露均衡性，报告各维度的正/负向总权重 |
| `node scripts/find-contributors.js` | 扫描指定维度的主要贡献题目 |

## Architecture
- **App.jsx** — state machine (`landing → test → loading → result`), all state lives here, pages receive callbacks via props. No routing library. Uses `AnimatePresence mode="wait"` with `custom=direction` for slide transitions. Loading has a hardcoded **3.5s `setTimeout`**.
- **Test.jsx two-phase flow**: first ~10 questions required with progress bar, then "已获得基本画像" transition, then optional explore phase (~62 more questions) that can be ended anytime.
- **Question bank**: ~72 questions across 3 data files re-exported from `src/data/questions.js`: `questions-single.js` (40, 4-choice), `questions-scale.js` (16, Likert 1-5), `questions-rank.js` (16, rank 4). ~60/20/20 split. All UI text is Chinese.
- **src/data/tags.js** & **src/data/archetypeProfiles.js** — 54 trait tags in 10 archetype groups, 10 archetype profiles (with 10-D vectors and narrative sub-sections `innerWorld`/`inRelation`/`hiddenSide`), 10 dimension configs (`src/data/dimensions.js`).
- **src/utils/blurEngine.js** — `generateResult(answers)` calculates 10-dimensional user vector from weighted responses, normalizes cosine similarities against 10 archetype profiles, picks top 5 tags, determines primary + secondary archetype, computes suppressed traits, and returns `dimensionScores`, `userVector`, `similarities`. Exports `DIMENSION_PAIRS`.
- **Components** (10): `ArchetypeProfileChart`, `BlurCard`, `DimensionMeters`, `DraggableTabs`, `GlassButton`, `OpticalFocusSpace` (3D parallax atmosphere), `ProgressBar`, `TraitRadar` (SVG), `TraitSpace2D` (interactive 2D canvas vector space), `TraitWeightChart`.
- **src/index.css** — `@theme` custom color tokens (`--color-blur-*`), glass morphism classes (`.glass`, `.glass-strong`), gradient border (`.prism-shift`), animation utilities (`animate-float`, `animate-pulse-glow`, `animate-drift`, `animate-breathe*`), custom range input (`.blur-slider`), custom scrollbar.

## Conventions
- Components: `export default function Component(...)` with destructured props; named exports for util functions/constants.
- State: `useState`/`useCallback`/`useRef` (no custom hooks except inline `useRotatingTip` in Landing.jsx).
- `TraitSpace2D` and `OpticalFocusSpace` use refs (`hoveredRef`, `rotRef`, `dataRef`, `animRef`) over state for smooth 60fps canvas/RAF loops.
- `BlurCard` uses `navigator?.vibrate?.(10)` for optional haptic feedback.
- ESLint v10: imports `defineConfig`/`globalIgnores` from `eslint/config` subpath (not root `eslint`); uses `reactHooks.configs.flat.recommended` and `reactRefresh.configs.vite`.
- CSS theme colors referenced as Tailwind classes: `bg-blur-bg`, `text-blur-text`, `border-blur-border`, etc.
