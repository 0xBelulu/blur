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
- **App.jsx** — screen router (state machine: landing → test → loading → result), uses `AnimatePresence` for transitions
- **src/pages/** — 4 screens: `Landing`, `Test`, `Loading`, `Result`
- **src/components/** — `BlurCard`, `CloudCanvas` (canvas renderer), `FocusSlider` (range input), `GlassButton` (3 variants), `ShareButton` (html2canvas download + Web Share API), `TagParticles`
- **src/data/questions.js** — 10 questions, tag pool (~70 traits with weights), 5 archetype descriptions (all UI text is in Chinese)
- **src/utils/blurEngine.js** — `generateResult(answers)` scores traits with weight × count + noise, picks top tags, determines archetype, generates cloud particle data
- **src/index.css** — Tailwind v4 `@theme` custom color tokens (`--color-blur-*`), glass morphism CSS classes, custom range slider, keyframe animations

## Style conventions
- Custom theme colors: `blur-bg`, `blur-surface`, `blur-border`, `blur-text`, `blur-accent`, etc. (all defined in `index.css` `@theme` block)
- Glass morphism utility classes: `.glass` and `.glass-strong`
- React: `useState`, `useCallback`, arrow functions, named exports for pages/components

## Notable
- Loading screen uses a hardcoded 3.5s `setTimeout` before transitioning to Result
- `CloudCanvas` renders at device pixel ratio on a `<canvas>` element
- `ShareButton` falls back to clipboard copy when Web Share API unavailable
- No routing library — screen switching is handled via state in `App.jsx`
- No test infrastructure exists
