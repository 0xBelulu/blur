# Blur 应用性能优化计划

## 问题诊断

应用切换/滑动卡顿的根本原因是 **CSS `filter: blur()` 动画 + `backdrop-filter` 双重开销**，叠加 Canvas 永不停止的 rAF 循环和 Result 页面动画过载。

---

## 优化步骤

### P0-1: 移除页面过渡动画中的 `filter: blur()`（影响：极高）

**文件**: `src/App.jsx`

**问题**: `pageVariants` 的 `enter`/`exit`/`center` 都使用了 `filter: "blur(4px)"` / `filter: "blur(0px)"`。每次页面切换时，整页内容在 transform 动画的同时还要做 blur 重绘，而页面上大量 `.glass` 元素本身就有 `backdrop-filter`，双重 blur 叠加极其昂贵。

**修复**:
- 从 `pageVariants` 中移除所有 `filter` 属性
- 保留 `opacity` + `x` + `scale` 动画（这些都是 GPU 合成层属性，不触发重绘）
- 如需模糊感，可微调 `opacity` 和 `scale` 值来补偿视觉效果的损失

```js
const pageVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 80 : -80,
    scale: 0.96,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
    scale: 0.96,
  }),
};
```

---

### P0-2: 移除题目切换动画中的 `filter: blur()`（影响：极高）

**文件**: `src/pages/Test.jsx`

**问题**: 每道题的切换动画使用了 `filter: "blur(10px)"`，10px blur 比 4px 更昂贵。用户每答一题就触发一次，72 题就是 72 次。过渡屏幕也用了 `blur(10px)`。

**修复**:
- 移除所有 `filter: "blur(10px)"` / `filter: "blur(0px)"`
- 保留 `opacity` + `x`/`y` 动画
- 通过增大位移和降低初始 opacity 来补偿模糊效果的移除

涉及 3 处：
1. 第 267-269 行：过渡屏幕的 `initial`/`animate`/`exit`
2. 第 312-314 行：题目切换的 `initial`/`animate`/`exit`

---

### P0-3: 移除 Loading 页标题的持续 blur 动画（影响：高）

**文件**: `src/pages/Loading.jsx`

**问题**: 第 55-56 行，标题文字在 3.5 秒 Loading 期间持续做 `filter: ["blur(0px)", "blur(1px)", "blur(0px)"]` 动画，每帧都触发重绘。

**修复**:
- 移除 `filter` 动画
- 用 `opacity` 微变（如 `[0.85, 1, 0.85]`）模拟呼吸感，opacity 是 GPU 合成属性不触发重绘

---

### P0-4: 移除 Landing 页轮播提示的 blur 动画（影响：高）

**文件**: `src/pages/Landing.jsx`

**问题**: 第 168-170 行，每 4.2 秒触发的轮播提示进出动画都带 `filter: "blur(3px)"`。

**修复**:
- 移除 `filter` 属性
- 保留 `opacity` + `y` 动画

---

### P0-5: 移除 CSS `gentle-breath` 动画中的 `filter: blur()`（影响：高）

**文件**: `src/index.css`

**问题**: 第 159-168 行，`@keyframes gentle-breath` 使用了 `filter: blur(0.2px)` / `filter: blur(0.85px)`，所有使用 `animate-breathe*` 类的元素都会持续触发 filter 重绘。

**修复**:
- 移除 `filter` 属性
- 仅保留 `opacity` 变化来模拟呼吸感

```css
@keyframes gentle-breath {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 0.76; }
}
```

---

### P1-1: Canvas rAF 循环优化 — TraitSpace2D（影响：高）

**文件**: `src/components/TraitSpace2D.jsx`

**问题**: 
1. rAF 循环永不停止，入场动画 700ms 完成后仍在 60fps 运行（仅为了用户点的脉冲动画）
2. `userVector` 在依赖数组中，每次 Result 重渲染时引用变化导致整个 effect 重建
3. 每帧创建 `createRadialGradient` 对象

**修复**:
- 入场动画完成后，将 rAF 降频到 ~15fps（用帧计数器跳帧）
- 将 `userVector` 从 effect 依赖中移除，改用 ref 传递
- 缓存不变的背景 gradient（仅 width/height 变化时重建）

---

### P1-2: Canvas rAF 循环优化 — VectorSpace3D（影响：高）

**文件**: `src/components/VectorSpace3D.jsx`

**问题**:
1. rAF 循环永不停止，自动旋转永远在 60fps 运行
2. 每帧创建多个 `createRadialGradient`
3. 每帧调用 `setLineDash` 切换 canvas 状态

**修复**:
- 自动旋转时降频到 ~15fps（自动旋转不需要 60fps 的流畅度）
- 用户拖拽时恢复 60fps
- 缓存背景 gradient

---

### P1-3: Result 页面动画过载优化（影响：高）

**文件**: `src/pages/Result.jsx`

**问题**: 挂载时同时启动 20+ 个 Framer Motion 动画，造成严重的帧率下降。

**修复**:
- 减少同时启动的动画数量，将延迟分散到更大范围
- 将 `vectorSize` 改为 `useMemo` 计算
- TraitSpace2D 外层的无限 `opacity` 动画（第 100-101 行）改为纯 CSS animation，避免 Framer Motion 开销

---

### P1-4: 提前计算 `generateResult`（影响：中高）

**文件**: `src/App.jsx`

**问题**: `generateResult` 在 3.5 秒 setTimeout 回调中同步执行，阻塞 Loading→Result 过渡帧。

**修复**:
- 进入 Loading 页面时立即在 `requestIdleCallback`（或 `setTimeout(0)` 降级）中计算结果
- 将结果暂存到 ref，setTimeout 到期后直接使用
- 如果计算尚未完成（极端情况），fallback 到同步计算

```js
const handleComplete = useCallback((finalAnswers) => {
  navigate("loading");

  const resultRef = { current: null };
  const compute = () => {
    resultRef.current = generateResult(finalAnswers, questions);
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(compute);
  } else {
    setTimeout(compute, 0);
  }

  if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
  loadingTimerRef.current = setTimeout(() => {
    try {
      const generatedResult = resultRef.current || generateResult(finalAnswers, questions);
      setResult(generatedResult);
      navigate("result");
    } catch {
      navigate("landing");
    }
  }, LOADING_DURATION);
}, [navigate]);
```

---

### P2-1: Landing 页背景光球优化（影响：中）

**文件**: `src/pages/Landing.jsx`

**问题**: 5 个 `motion.div` 背景光球，每个都有无限循环的 scale/opacity 动画，且都带有 CSS `blur-3xl`（72px）或 `blur-2xl`（40px）。Framer Motion 的 scale 动画导致浏览器需要重新计算 72px 的高斯模糊。

**修复**:
- 将 Framer Motion 动画替换为纯 CSS `@keyframes` 动画
- CSS animation 的 `transform` 和 `opacity` 由浏览器合成器处理，不会触发 filter 重绘（因为 `filter: blur()` 是静态的，只有 `transform` 在变）

在 `index.css` 中添加：
```css
@keyframes orb-float-1 {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.3); opacity: 0.4; }
}
```

然后将 `motion.div` 改为普通 `div`，使用 CSS animation class。

---

### P2-2: BlurCard 悬停改用 CSS（影响：中低）

**文件**: `src/components/BlurCard.jsx`

**问题**: 使用 `useState` 管理悬停状态，每次鼠标进入/离开都触发 React re-render。

**修复**:
- 移除 `isHovered` state
- 用 CSS `:hover` 伪类处理悬停样式
- 保留 `whileTap` 的 Framer Motion 触觉反馈

---

### P2-3: `blurEngine.js` 中 `questionMap` 缓存（影响：低）

**文件**: `src/utils/blurEngine.js`

**问题**: `accumulateDimensions` 每次调用都创建 `new Map(questions.map(...))`，但 questions 列表是静态的。

**修复**:
- 将 `questionMap` 提升为模块级缓存，只在首次调用时创建

---

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/App.jsx` | P0-1: 移除 pageVariants 的 filter; P1-4: 提前计算 generateResult |
| `src/pages/Test.jsx` | P0-2: 移除题目/过渡动画的 filter |
| `src/pages/Loading.jsx` | P0-3: 移除标题 blur 动画，改用 opacity |
| `src/pages/Landing.jsx` | P0-4: 移除轮播提示 blur; P2-1: 背景光球改 CSS 动画 |
| `src/pages/Result.jsx` | P1-3: 减少同时动画数，vectorSize memo，TraitSpace2D 外层改 CSS |
| `src/index.css` | P0-5: gentle-breath 移除 filter; P2-1: 添加光球 CSS keyframes |
| `src/components/TraitSpace2D.jsx` | P1-1: rAF 降频，userVector 改 ref，缓存 gradient |
| `src/components/VectorSpace3D.jsx` | P1-2: rAF 降频，缓存 gradient |
| `src/components/BlurCard.jsx` | P2-2: 悬停改 CSS |
| `src/utils/blurEngine.js` | P2-3: questionMap 模块级缓存 |

## 预期效果

- **P0 修复后**: 页面过渡和题目切换的卡顿应该有**质的改善**，因为消除了每帧的 filter 重绘
- **P1 修复后**: Canvas 组件不再持续占用 60fps，Result 页面初始渲染更流畅，Loading→Result 过渡无阻塞
- **P2 修复后**: 减少不必要的 React 重渲染和内存分配
