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
- **App.jsx** — state machine (`landing → test → loading → result`), all state lives here, pages receive callbacks via props. No routing library. Uses `AnimatePresence mode="wait"` with `custom=direction` for slide transitions. Loading has a hardcoded **3.5s `setTimeout`**. `justFinished` marks a result completed in this session so only that result may invite an identity; opening a record from history stays quiet.
- **AppBackground.jsx** — persistent viewport atmosphere/optical scenes outside the page transition tree. Background and foreground share one opacity MotionValue (old scene 1→0, new scene 0→1); scene styles switch immediately at the transparent boundary, without independent CSS fades. `PageTransition` reports its presence so the background changes when the next page actually mounts, after the previous exit. Only the detailed optical layer shares the transition blur; large watercolor textures and dither remain stable. Hidden scenes pause instead of remounting. Test reports saved-answer symbols to App; About's embedded optical field remains local.
- **Test.jsx two-phase flow**: first ~10 questions required with progress bar, then "已获得基本画像" transition, then optional explore phase (~62 more questions) that can be ended anytime.
- **Question bank**: ~72 questions across 3 data files re-exported from `src/data/questions.js`: `questions-single.js` (40, 4-choice), `questions-scale.js` (16, Likert 1-5), `questions-rank.js` (16, rank 4). ~60/20/20 split. All UI text is Chinese.
- **src/pages/About.jsx** — the explore page: editorial sections plus an embedded `OpticalStage` (`scope="container"`, `ABOUT_PRESET`, `ARCHETYPE_SYMBOLS`) whose `onFocusChange` drives the archetype readout. Interior scrolls inside `h-[100svh]`.
- **src/data/tags.js** & **src/data/archetypeProfiles.js** — 54 trait tags in 10 archetype groups, 10 archetype profiles (with 10-D vectors and narrative sub-sections `innerWorld`/`inRelation`/`hiddenSide`), 10 dimension configs (`src/data/dimensions.js`).
- **src/utils/blurEngine.js** — `generateResult(answers)` calculates 10-dimensional user vector from weighted responses, normalizes cosine similarities against 10 archetype profiles, picks top 5 tags, determines primary + secondary archetype, computes suppressed traits, and returns `dimensionScores`, `userVector`, `similarities`. Exports `DIMENSION_PAIRS`.
- **src/utils/palette.js** — 环境色（界面、光场、图表共用）的唯一 JS 来源：`INK` / `PAPER` / `ACCENT` / `SKY` / `GOLD` / `DEEP` + `rgba(rgb, a)` / `hex(rgb)`。`src/index.css` 的 `@theme` 是它的 CSS 镜像（Tailwind 只收字面量），**改色必须同时改两处**。这三层颜色分工不同，不要混用：信息层 = 原型色（不可改）、用户可选层 = `shared/accents.js` 的 8 色板、表达层 = 这里的环境色。旧代码里散落各处的 `rgba(155,142,199,…)` 字面量已经收口到这里，不要再写新的。光场四团洗染只用三个色相（蓝紫 / 天蓝 / 奶油金）+ 主色的深一档，没有粉色——粉色是画面发糊的来源。
- **shared/accents.js** — 主色的唯一来源。8 色色板（命名沿用原型那套摄影/材料意象，不要用「天青」「藕紫」这类传统色名）+ `ACCENT_KEYS`（服务端白名单共用）+ `resolveAccent(account, profile)` + `personAccent(person, profile)` + `markShades(rgb)`。**颜色分两层**：信息层是原型色（`archetypeProfiles.color`，历史记录圆点、完整画像、分享用，不可改），表达层是主色（头像 `PortraitMark`、光场 `PortraitField`，默认 `follow` 跟随当前展示画像）。色板任意两色 ΔE ≥ 14，由 `scripts/unit-tests.js` 守卫——原型色只有平均 19.5，压进 59px 头像后多数低于可辨阈值，所以色板不能直接复用原型色。`accounts.accent` 存 key，`NULL` 与 `follow` 等价。
- **Components** (12): `ArchetypeProfileChart`, `AtmosphereField` (watercolor gradient wash), `BlurCard`, `DimensionMeters`, `DraggableTabs`, `GlassButton`, `IdentityInvite` (post-result identity dialog: inline naming, friend code, recovery key), `ProgressBar`, `TraitRadar` (SVG), `TraitSpace2D` (interactive 2D canvas vector space), `TraitWeightChart`. 另有 `AccentPicker`（受控选择器，放在**编辑资料弹窗**里，和昵称、简介一起由「保存资料」提交；不要在设置里再开一个入口）。
- **Shared UI primitives** — 这些存在的理由就是"别再抄一遍"。抄过一次的地方已经各自漂了（标题重影 14/4px vs 16/5px、小标 10px/75 vs 11px/85、CTA 两种尺寸）：
  - `CatalogShell` — 原型 / 特质 / 题库三个目录页的外壳（返回头、虚线时间轴、横线纸纹、内容 padding）。新增目录页直接包它，不要复制 `Archetypes.jsx`。
  - `AccordionCard` — 目录页那条可展开的卡片（`summary` + `children`），三页共用。
  - `Reveal` / `useRevealProps`（`src/utils/motion.js`）— 章节入场的唯一实现，参数只此一份；`EASE` 也在这里。
  - `ChromaticTitle` — 标题的色散重影。`blur` 用 em，跟着字号走，换页面不会再分叉。
  - `Eyebrow` — 短线 + 全大写小标，`line="full"` 换成通栏细线。
  - `GlassButton` — 只有 `md` / `lg` 两档尺寸；传 `href` 会渲染成 `<a>`（外链 CTA 用它，不要手写 `<a className="...glass-strong...">`）。
- **src/components/optical/** — shared optical background, split into engine / shell / presets:
  - `useOpticalField.js` — physics only (camera, focus plane, parallax, gyro, tap-to-focus, RAF). No DOM; writes transform/filter/opacity into passed refs.
  - `OpticalStage.jsx` — render shell (container, stardust, symbols, reticle). Calls the hook. `scope="container"` embeds the field in the nearest positioned parent instead of the viewport; `symbolClassName` and `onFocusChange` are optional.
  - `symbols.js` — `SPATIAL_SYMBOLS` (Landing's 14) + `STARDUST_PARTICLES`. `src/data/archetypeField.js` holds the 10 archetype symbols for the explore page, same shape and same `id` keys as `archetypeProfiles`.
  - `presets.js` — `LANDING_PRESET` / `TEST_PRESET` / `ABOUT_PRESET`. **Per-page differences belong here**, not in the engine. `maxBlur` caps defocus (a 360px-tall field can't use the full-viewport 13.5px); `minBlur` raises it.
  - `focusMode`: `"pointer"` (Landing + explore page, focus follows cursor/gyro) vs `"persona"` (test page, focus plane pinned, clarity driven by each symbol's `z`).
  - `onFocusChange(item | null)` fires only when the focused symbol changes, so pages can render a readout without per-frame React renders. `scope="container"` ignores pointer input outside the container and normalizes parallax to it.
  - `active={false}` suspends RAF, native dust animations and input handling while retaining nodes, engine state and animation objects. Visibility changes must not wake an inactive field.
- **Community / 星图 (`src/pages/Community.jsx`, `src/components/CommunityField.jsx`)** — `#community` 路由，只读、匿名、不可点开。渲染是四层：纸面 / 墨雾（1/6 分辨率累积层，重叠处积墨）/ 颗粒（软光斑 + 实心核）/ 自己。**稀疏和密集只由 `densityOf(total)` 一个数驱动**：稀疏时每颗更大更亮、带光晕，密集时墨雾接管、颗粒退成纹理，`total > 500` 隔 2 个画一个。改动这块前先看 [docs/community.md](docs/community.md) 的「渲染」一节——SpaceEngine 的 LOD + 光斑叠加，但要记住底色是暖白纸，**加法混合会糊成奶白，只能用积墨**。图上的点有两个来源，都不带身份：**① 账号「展示中的画像」**（`accounts.portrait_id` + `friends_visible = 1`），**② 一次测试完成**（`field_points` 一行，`migrations/0011`）。① 是「我想被看见」的表态，改「仅我可见」就消失，所以 `Settings.jsx` 里「好友可见」的说明必须讲清它会成为一个匿名点；② 让星图的参照系是「所有做完的人」而不是「愿意展示的人」——只有 ① 时 123 次完成只对应 14 个点。②**不可跨设备撤销**：id 只存在本机，清了存储就再也找不到那个点，界面必须如实说，不要写成可撤销。一台设备一个点，已有展示画像的人不再留匿名点（否则同一个人两个点）。`GET /api/community/field` 匿名可读，只返回 `{ version, total, completed, points: [[x,y]], you }`——不带 id、昵称、原型、时间或顺序；`?point=<id>` 把本机匿名点摘出来当 `you`。`POST /api/community/point` 由**服务端**投影（前端送向量、不送坐标），`DELETE /api/community/point/:id` 撤下。`server/community.js` 必须排在 `ownerHash()` 之前，否则匿名访客会先吃 401。
- **shared/projection.js** — 十维 → 二维的固定基底，服务端与前端共用。`node scripts/compute-projection.js --apply` 用固定种子采样 20000 份作答做 PCA（PC1 40.1% + PC2 29.9% = 69.9%），写回 `<generated>` 区块。轴的符号由人约定（x 正 = 表达/外放，y 正 = 流动/开放），脚本按 `expressivity` / `changeAffinity` 的载荷翻正，重跑不会把整张图翻面。**不要在前端临时算投影**：位置一旦出现就不该在下次刷新时挪动。二维只保留七成方差，界面必须把位置说成近似。
- **src/pages/Admin.jsx** — `#admin` read-only dashboard: anonymous counters, cloud aggregates and per-day trend. Token lives in `sessionStorage`; `server/metrics.js` verifies it against the `admin_tokens` SHA-256, outside the user identity system. Never add answers, portrait content, friend edges or per-user records here.
- **Cloud identity is explicit** — `POST /api/account` is the only path that creates an `accounts` row. Reading `/account`, syncing a record, and exporting a recovery key must never create one. Every upload also requires an existing identity (`requireCloudIdentity`, 409 otherwise): an account-less profile row would be unreachable if the device were lost and invisible to the ghost cleanup, which walks `accounts`. `syncDefaultPortrait` was removed on purpose — no portrait reaches the cloud without an explicit tap.
- **Identity invite on the result page** — `IdentityInvite` creates the identity in place with `saveProfile(..., true)`; there is no detour through 「我的」. It only opens for a just-finished result when `account.registered` is false. `src/utils/identityInvite.js` owns the guest policy (once per record id, 3-day snooze after a refusal, no automatic invitation after two refusals) and is unit-tested. Creating an identity here still uploads **no portrait**; the success step offers the friend code and the recovery key, and the result's share controls become the explicit 「同步到云端」 step. The dismissal mark must be written inside the timer, not before it: StrictMode runs the effect twice and the first pass is cleaned up.
- **Leaving an identity** — two different actions, both in Settings group 04. `signOut()` (`src/utils/cloud.js`) drops the credential and detaches device portraits with `switchHistoryIdentity()`, so the portraits stay but stop claiming a cloud copy; it is reversible with the recovery key. `deleteIdentity()` calls `DELETE /api/account` and then forgets the device, optionally clearing local records.
- **Deletion is a tombstone, not a row delete** (`server/people.js`, `0009_account_deletion.sql`). The account row survives with `deleted_at`, cleared nickname/bio/portrait, `friend_code = NULL`, and `public_id` intact. `registerAccount()` and `account()` refuse it with 410 so a delayed upload from an old device cannot recreate it with a new public id. Friendships are kept for 30 days and returned with `person.deleted`, so a friend sees "已注销" instead of a silent disappearance.
- **Ghost cleanup** (`server/ghosts.js`, `scripts/purge-ghosts.js`) is admin-only and dry-run by default. Four tiers: orphan (never had a profile or friendship, 30 days) is deleted; dormant (180 days without a device) is tombstoned; expired tombstones (30 days) are removed with their friendships; unowned profiles (no account row at all, 30 days) are deleted — they are unreachable by any key and invisible to the account walk. Pages Functions have no cron trigger, so it runs manually or from an external scheduler — never inside a request handler.
- **src/index.css** — `@theme` custom color tokens (`--color-blur-*`), glass morphism classes (`.glass`, `.glass-strong`), gradient border (`.prism-shift`), animation utilities (`animate-float`, `animate-pulse-glow`, `animate-drift`, `animate-breathe*`), custom range input (`.blur-slider`), custom scrollbar.

## Conventions
- Components: `export default function Component(...)` with destructured props; named exports for util functions/constants.
- State: `useState`/`useCallback`/`useRef` (no custom hooks except inline `useRotatingTip` in Landing.jsx).
- `TraitSpace2D` and `useOpticalField` use refs (`hoveredRef`, `rotRef`, `dataRef`, `animRef`) over state for smooth 60fps canvas/RAF loops.
- **Any page that renders a `fixed` background must give its root `min-h-[100svh]`** — `App.jsx`'s page wrapper sets `contain: layout style paint`, which makes it the containing block for `fixed` descendants and clips them to its own height.
- `BlurCard` uses `navigator?.vibrate?.(10)` for optional haptic feedback.
- ESLint v10: imports `defineConfig`/`globalIgnores` from `eslint/config` subpath (not root `eslint`); uses `reactHooks.configs.flat.recommended` and `reactRefresh.configs.vite`.
- CSS theme colors referenced as Tailwind classes: `bg-blur-bg`, `text-blur-text`, `border-blur-border`, etc.
