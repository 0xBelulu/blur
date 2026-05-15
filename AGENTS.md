# Blur — Agent Instructions

## Stack
- React 19 + Vite 8 + Tailwind CSS v4 (plain `.jsx`, no TypeScript)
- **Framer Motion** for page transitions, **html2canvas** for screenshot export, **lucide-react** for icons
- Tailwind v4: configured via `@tailwindcss/vite` plugin and `@import "tailwindcss"` in CSS (no `tailwind.config.js`)
- `@types/react` installed for editor intellisense only — do not add `.ts/.tsx` files

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint v10 flat config (single command, no typecheck step) |
| `npm run preview` | Preview production build |

No test framework — there are no test scripts or test files.

## Architecture
- **App.jsx** — screen router (state machine: `landing → test → loading → result`), uses `AnimatePresence` with a `custom=direction` prop for slide direction; all state lives in App, pages receive callbacks via props. No routing library.
- **src/pages/** — 4 screens: `Landing`, `Test`, `Loading`, `Result`
- **src/components/** — `BlurCard`, `CloudCanvas` (canvas at device pixel ratio), `DimensionMeters` (5-bar gauge), `FocusSlider` (range input), `GlassButton` (3 variants), `ShareButton` (html2canvas download + Web Share API, clipboard fallback), `TagParticles`, `TraitRadar` (SVG radar chart), `VectorSpace3D` (3D canvas visualization)
- **src/data/questions.js** — 10 questions (single-choice with `optionId`, scale with `traits`, rank-order with `rankOrder`), ~70 trait tags with weights, 5 archetype descriptions, dimension configs (all UI text is Chinese)
- **src/utils/blurEngine.js** — `generateResult(answers)` scores traits (weight × count + seed-based noise), picks top 5 tags, determines archetype, generates cloud particle data; also exports `mapTo3D`, `ARCHETYPE_VECTORS`, `VECTOR_AXES`
- **src/index.css** — Tailwind v4 `@theme` custom color tokens (`--color-blur-*`), glass morphism classes, custom `blur-slider` range input, keyframe animations, custom scrollbar
- **public/** — `favicon.svg` (referenced in index.html); `icons.svg` is unused

## Style & configuration quirks
- Custom theme colors: `blur-bg`, `blur-surface`, `blur-border`, `blur-text`, `blur-accent`, etc. (all in `index.css` `@theme` block)
- Glass morphism utility classes: `.glass` and `.glass-strong`; gradient border via `.prism-shift`
- Animation utility classes: `animate-float`, `animate-pulse-glow`, `animate-drift`, `animate-breathe*`
- Custom range input: use class `.blur-slider` (styled track + thumb)
- React: `useState`, `useCallback`, arrow functions, named exports for pages/components
- ESLint v10: config imports `defineConfig` and `globalIgnores` from `eslint/config` (subpath — not from `eslint` package root); uses `reactHooks.configs.flat.recommended` and `reactRefresh.configs.vite`; `globalIgnores(['dist'])` ignores build output

## Quirks & gotchas
- Loading screen uses a hardcoded **3.5s `setTimeout`** in `App.jsx` before transitioning to Result
- `CloudCanvas` renders at `devicePixelRatio` for sharp output
- `ShareButton` falls back to clipboard copy when Web Share API is unavailable
- `public/icons.svg` is not referenced anywhere in the app
