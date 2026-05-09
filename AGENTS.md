# Blur — Agent Instructions

## Stack
- React 19 + Vite 8 + Tailwind CSS v4 (no TypeScript, plain `.jsx`)
- **Framer Motion** for animations, **html2canvas** for screenshot export, **lucide-react** for icons
- Tailwind v4: configured via `@tailwindcss/vite` plugin and `@import "tailwindcss"` in CSS (no `tailwind.config.js`)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint flat config (no typecheck step) |
| `npm run preview` | Preview production build |

No test framework — there are no test scripts or test files.

## Architecture
- **App.jsx** — screen router (state machine: landing → test → loading → result), uses `AnimatePresence` for transitions; all state lives in App, pages receive callbacks via props
- **src/pages/** — 4 screens: `Landing`, `Test`, `Loading`, `Result`
- **src/components/** — `BlurCard`, `CloudCanvas` (canvas renderer), `DimensionMeters` (5-dimension bar gauges), `FocusSlider` (range input), `GlassButton` (3 variants), `ShareButton` (html2canvas download + Web Share API), `TagParticles`, `TraitRadar` (SVG radar chart), `VectorSpace3D` (3D canvas visualization)
- **src/data/questions.js** — 10 questions (two formats: single-choice with `optionId`, and rank-order with `rankOrder`), tag pool (~70 traits with weights), 5 archetype descriptions, dimension configs (all UI text is in Chinese)
- **src/utils/blurEngine.js** — `generateResult(answers)` scores traits with weight × count + noise, picks top 5 tags, determines archetype from ARCHETYPE_TRAITS mapping, generates cloud particle data; also exports `mapTo3D`, `ARCHETYPE_VECTORS`, `VECTOR_AXES`
- **src/index.css** — Tailwind v4 `@theme` custom color tokens (`--color-blur-*`), glass morphism CSS classes, custom range slider, keyframe animations, custom scrollbar
- **public/** — `favicon.svg` and an unused `icons.svg`

## Style conventions
- Custom theme colors: `blur-bg`, `blur-surface`, `blur-border`, `blur-text`, `blur-accent`, etc. (all defined in `index.css` `@theme` block)
- Glass morphism utility classes: `.glass` and `.glass-strong`; gradient border via `.prism-shift`
- Animation utility classes: `.animate-float`, `.animate-pulse-glow`, `.animate-drift`, `.animate-breathe`, `.animate-breathe-fast`, `.animate-breathe-slow`
- Custom range input: use class `.blur-slider` (styled track + thumb)
- React: `useState`, `useCallback`, arrow functions, named exports for pages/components
- ESLint v10 flat config via `defineConfig` from `eslint/config` (not `eslint` package export)

## Notable
- Loading screen uses a hardcoded 3.5s `setTimeout` before transitioning to Result
- `CloudCanvas` renders at device pixel ratio on a `<canvas>` element
- `ShareButton` falls back to clipboard copy when Web Share API unavailable
- No routing library — screen switching is handled via state in `App.jsx`
- No test infrastructure exists
