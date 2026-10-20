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

## Cloudflare / D1 migrations and releases
- Frontend and Pages Functions deploy separately from D1 schema changes. **`npm run build`, Git pushes, and Pages deployments do not apply D1 migrations.** `npm run db:migrate:local` updates only the local database.
- Any change that adds or uses database columns, tables, or indexes must include a versioned SQL migration in `migrations/`. Review its compatibility with the currently deployed code; preserve existing accounts, snapshots, shares, and permissions.
- Before a release that depends on a migration, run `npx wrangler d1 migrations list blur --remote` against the intended production database. For compatible additive migrations, apply `npm run db:migrate:remote` **before deploying the dependent code**, then confirm no required migrations remain. If the migration cannot coexist with the old code, define the rollout order explicitly before release.
- A local migration or passing local tests is **not evidence of production readiness**. If remote migration or verification was not performed, state that explicitly in the handoff and identify the remaining release step. Never report the production feature as ready based only on a local test.
- After a schema-dependent release or production migration, verify the actual production API, including a write and subsequent read for the affected feature. Use an isolated temporary identity when needed, clean up only its test data, and do not expose credentials or inspect unrelated user data.
- For production API 503s that do not occur locally, first check the `DB` binding and pending remote migrations. The API intentionally returns a generic 503 for unhandled database errors; the browser stack trace alone does not identify the cause. Do not add automatic DDL/schema repair to request handlers or put production migration credentials into frontend builds.
- Incident recorded 2026-10-18: the new account/friend code was deployed while production still lacked `0003_people.sql`. Account registration and existing-account reads returned 503. Applying that migration to the production `blur` D1 restored registration, account reads, friend lists, and portrait settings. Deployment details: [docs/backend.md](docs/backend.md).

## Scripts (calibration & audit)
| Script | Purpose |
|--------|---------|
| `node scripts/balance-audit.js --trials 5000` | Monte Carlo 平衡性审计，检查各原型在随机回答下的胜率分布 |
| `node scripts/compute-baselines.js --trials 20000 --apply` | 随机基线校准，重算各原型的余弦相似度 μ/σ 并写入 blurEngine.js |
| `node scripts/analyze-exposure.js` | 分析维度暴露均衡性，报告各维度的正/负向总权重 |
| `node scripts/find-contributors.js` | 扫描指定维度的主要贡献题目 |
| `npm run admin:token -- --apply local` | 生成后台访问令牌并写入 D1（仅保存 SHA-256）；`remote` 写入线上 |
| `npm run ghosts:purge -- --token <后台令牌>` | 幽灵身份清理，默认只读；加 `--apply` 才写入。连接本机或 `--base https://…`，参数 `--orphan-days/--dormant-days/--tombstone-days` |

## Architecture
- **App.jsx** — state machine (`landing → test → loading → result`), all state lives here, pages receive callbacks via props. No routing library. Uses `AnimatePresence mode="wait"` with `custom=direction` for slide transitions. Loading has a hardcoded **3.5s `setTimeout`**.
- **AppBackground.jsx** — persistent viewport atmosphere/optical scenes outside the page transition tree. Background and foreground share one opacity MotionValue (old scene 1→0, new scene 0→1); scene styles switch immediately at the transparent boundary, without independent CSS fades. `PageTransition` reports its presence so the background changes when the next page actually mounts, after the previous exit. Only the detailed optical layer shares the transition blur; large watercolor textures and dither remain stable. Hidden scenes pause instead of remounting. Test reports saved-answer symbols to App; About's embedded optical field remains local.
- **Test.jsx two-phase flow**: first ~10 questions required with progress bar, then "已获得基本画像" transition, then optional explore phase (~62 more questions) that can be ended anytime.
- **Question bank**: ~72 questions across 3 data files re-exported from `src/data/questions.js`: `questions-single.js` (40, 4-choice), `questions-scale.js` (16, Likert 1-5), `questions-rank.js` (16, rank 4). ~60/20/20 split. All UI text is Chinese.
- **src/pages/About.jsx** — the explore page: editorial sections plus an embedded `OpticalStage` (`scope="container"`, `ABOUT_PRESET`, `ARCHETYPE_SYMBOLS`) whose `onFocusChange` drives the archetype readout. Interior scrolls inside `h-[100svh]`.
- **src/data/tags.js** & **src/data/archetypeProfiles.js** — 54 trait tags in 10 archetype groups, 10 archetype profiles (with 10-D vectors and narrative sub-sections `innerWorld`/`inRelation`/`hiddenSide`), 10 dimension configs (`src/data/dimensions.js`).
- **src/utils/blurEngine.js** — `generateResult(answers)` calculates 10-dimensional user vector from weighted responses, normalizes cosine similarities against 10 archetype profiles, picks top 5 tags, determines primary + secondary archetype, computes suppressed traits, and returns `dimensionScores`, `userVector`, `similarities`. Exports `DIMENSION_PAIRS`.
- **Components** (11): `ArchetypeProfileChart`, `AtmosphereField` (watercolor gradient wash), `BlurCard`, `DimensionMeters`, `DraggableTabs`, `GlassButton`, `ProgressBar`, `TraitRadar` (SVG), `TraitSpace2D` (interactive 2D canvas vector space), `TraitWeightChart`.
- **src/components/optical/** — shared optical background, split into engine / shell / presets:
  - `useOpticalField.js` — physics only (camera, focus plane, parallax, gyro, tap-to-focus, RAF). No DOM; writes transform/filter/opacity into passed refs.
  - `OpticalStage.jsx` — render shell (container, stardust, symbols, reticle). Calls the hook. `scope="container"` embeds the field in the nearest positioned parent instead of the viewport; `symbolClassName` and `onFocusChange` are optional.
  - `symbols.js` — `SPATIAL_SYMBOLS` (Landing's 14) + `STARDUST_PARTICLES`. `src/data/archetypeField.js` holds the 10 archetype symbols for the explore page, same shape and same `id` keys as `archetypeProfiles`.
  - `presets.js` — `LANDING_PRESET` / `TEST_PRESET` / `ABOUT_PRESET`. **Per-page differences belong here**, not in the engine. `maxBlur` caps defocus (a 360px-tall field can't use the full-viewport 13.5px); `minBlur` raises it.
  - `focusMode`: `"pointer"` (Landing + explore page, focus follows cursor/gyro) vs `"persona"` (test page, focus plane pinned, clarity driven by each symbol's `z`).
  - `onFocusChange(item | null)` fires only when the focused symbol changes, so pages can render a readout without per-frame React renders. `scope="container"` ignores pointer input outside the container and normalizes parallax to it.
  - `active={false}` suspends RAF, native dust animations and input handling while retaining nodes, engine state and animation objects. Visibility changes must not wake an inactive field.
- **src/pages/Admin.jsx** — `#admin` read-only dashboard: anonymous counters, cloud aggregates and per-day trend. Token lives in `sessionStorage`; `server/metrics.js` verifies it against the `admin_tokens` SHA-256, outside the user identity system. Never add answers, portrait content, friend edges or per-user records here.
- **Leaving an identity** — two different actions, both in Settings group 04. `signOut()` (`src/utils/cloud.js`) drops the credential and detaches device portraits with `switchHistoryIdentity()`, so the portraits stay but stop claiming a cloud copy; it is reversible with the recovery key. `deleteIdentity()` calls `DELETE /api/account` and then forgets the device, optionally clearing local records.
- **Deletion is a tombstone, not a row delete** (`server/people.js`, `0009_account_deletion.sql`). The account row survives with `deleted_at`, cleared nickname/bio/portrait, `friend_code = NULL`, and `public_id` intact. `registerAccount()` and `account()` refuse it with 410 so a delayed upload from an old device cannot recreate it with a new public id. Friendships are kept for 30 days and returned with `person.deleted`, so a friend sees "已注销" instead of a silent disappearance.
- **Ghost cleanup** (`server/ghosts.js`, `scripts/purge-ghosts.js`) is admin-only and dry-run by default. Three tiers: orphan (never had a profile or friendship, 30 days) is deleted; dormant (180 days without a device) is tombstoned; expired tombstones (30 days) are removed with their friendships. Pages Functions have no cron trigger, so it runs manually or from an external scheduler — never inside a request handler.
- **src/index.css** — `@theme` custom color tokens (`--color-blur-*`), glass morphism classes (`.glass`, `.glass-strong`), gradient border (`.prism-shift`), animation utilities (`animate-float`, `animate-pulse-glow`, `animate-drift`, `animate-breathe*`), custom range input (`.blur-slider`), custom scrollbar.

## Conventions
- Components: `export default function Component(...)` with destructured props; named exports for util functions/constants.
- State: `useState`/`useCallback`/`useRef` (no custom hooks except inline `useRotatingTip` in Landing.jsx).
- `TraitSpace2D` and `useOpticalField` use refs (`hoveredRef`, `rotRef`, `dataRef`, `animRef`) over state for smooth 60fps canvas/RAF loops.
- **Any page that renders a `fixed` background must give its root `min-h-[100svh]`** — `App.jsx`'s page wrapper sets `contain: layout style paint`, which makes it the containing block for `fixed` descendants and clips them to its own height.
- `BlurCard` uses `navigator?.vibrate?.(10)` for optional haptic feedback.
- ESLint v10: imports `defineConfig`/`globalIgnores` from `eslint/config` subpath (not root `eslint`); uses `reactHooks.configs.flat.recommended` and `reactRefresh.configs.vite`.
- CSS theme colors referenced as Tailwind classes: `bg-blur-bg`, `text-blur-text`, `border-blur-border`, etc.
