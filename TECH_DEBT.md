# Blur 项目技术债务报告

> 扫描日期：2026-05-17
> 扫描范围：`src/` 全部源码、`public/` 资源、配置文件

---

## 一、死代码 / 未使用组件

- [ ] **TD-01** `TagParticles` 组件完全未使用 — 整个文件 `src/components/TagParticles.jsx` 无任何引用
- [ ] **TD-02** `CloudCanvas` 组件完全未使用 — 整个文件 `src/components/CloudCanvas.jsx` 无任何引用
- [ ] **TD-03** `FocusSlider` 组件完全未使用 — 整个文件 `src/components/FocusSlider.jsx` 无任何引用
- [ ] **TD-04** `blurEngine.js` 返回的 `clarity`、`cloudData`、`tags` 字段未被消费 — `Result.jsx` 解构时未使用这三个字段
- [ ] **TD-05** `ARCHETYPE_TRAITS` 不需要 export — 仅在 `questions.js` 内部被 `DIMENSIONS` 引用，无外部导入
- [ ] **TD-06** `public/icons.svg` 未被任何文件引用
- [ ] **TD-07** `src/assets/hero.png`、`react.svg`、`vite.svg` 未被任何文件引用
- [ ] **TD-08** `html2canvas` 是 `package.json` 依赖但从未在代码中使用（原 `ShareButton` 组件已移除）

---

## 二、未使用的变量 / 参数 / 导入

- [ ] **TD-09** `BlurCard` 接收了未声明的 `index` prop — `Test.jsx` 传入 `index={i}`，但 `BlurCard` 函数签名中无 `index`
- [ ] **TD-10** `CloudCanvas` 的 `focus` prop 声明但未使用 — 在 `useEffect` 依赖数组中导致无意义重建
- [ ] **TD-11** `VectorSpace3D` 中 `AXES` 和 `ARCHETYPES` 是不必要的别名 — 直接使用 `VECTOR_AXES` 和 `ARCHETYPE_VECTORS` 即可

---

## 三、潜在 Bug

- [ ] **TD-12** `setTimeout` 未清理 — `App.jsx` 中 `handleComplete` 的 `setTimeout` 无清理机制，组件卸载后仍会执行 `setScreen`/`setResult`
- [ ] **TD-13** `handleComplete` 绕过 `navigate` 函数 — 直接调用 `setScreen("result")` 和 `setDirection(1)`，与 `navigate` 逻辑不一致
- [ ] **TD-14** `handleContinueExplore` 缺少边界检查 — `shuffledQuestions[REQUIRED_COUNT + 1]` 可能为 `undefined`
- [ ] **TD-15** `navigator.vibrate` 缺少安全调用 — 某些环境下可能抛出异常
- [ ] **TD-16** `VectorSpace3D` 的 `hovered` 状态在 `useEffect` 依赖中 — 每次悬停/离开都重建整个 canvas 动画循环和事件监听器

---

## 四、性能问题

- [ ] **TD-17** `VectorSpace3D` 的 `dataRef` 同步 `useEffect` 缺少依赖数组 — 每次渲染都执行，应添加依赖或直接在渲染阶段赋值
- [ ] **TD-18** `VectorSpace3D` 中 `toScreen` 函数重复定义 — 在 `handlePointerMove` 和 `useEffect` 中各定义一次，逻辑完全相同

---

## 五、缺失的错误处理

- [ ] **TD-19** `generateResult` 无异常保护 — `App.jsx` 中调用无 try-catch，异常输入会导致白屏
- [ ] **TD-20** Canvas `getContext("2d")` 无 null 检查 — `VectorSpace3D.jsx` 和 `CloudCanvas.jsx` 中可能返回 null

---

## 六、代码重复

- [ ] **TD-21** `App.jsx` 中四个 `motion.div` 包装器高度重复 — `custom`、`variants`、`initial`、`animate`、`exit`、`transition` 全部重复
- [ ] **TD-22** `Result.jsx` 中进度条渲染模式重复 — `TagCard` 和 `scoredTraits` 列表中的进度条结构几乎相同
- [ ] **TD-23** `blurEngine.js` 中 `tagPool[trait]` 查找 + 回退模式重复 — `generateResult` 和 `determineSuppressedTraits` 中各出现一次

---

## 七、CSS / 样式问题

- [ ] **TD-24** `@font-face` 伪声明 — `index.css` 中用 `local()` 引用系统字体创建别名，不是规范的 `@font-face` 用法
- [ ] **TD-25** CSS 中硬编码颜色值 — `.glass-strong`、`.prism-shift`、`.blur-slider` 等类中使用硬编码 `rgba()` 而非主题变量

---

## 八、可访问性问题

- [ ] **TD-26** `BlurCard` 缺少键盘交互支持 — 无 `role="button"`、`tabIndex`、`onKeyDown`
- [ ] **TD-27** `VectorSpace3D` canvas 缺少 ARIA 标签 — 无 `aria-label` 或 `role`

---

## 九、配置 / 维护问题

- [ ] **TD-28** `index.html` 中 `lang="en"` — 应用 UI 全部为中文，应改为 `lang="zh-CN"`
- [ ] **TD-29** `index.html` 缺少 `description` meta 标签
- [ ] **TD-30** 命名不一致 — `Landing.jsx` 用 `TIPS`（SCREAMING_SNAKE_CASE），`Loading.jsx` 用 `loadingTexts`（camelCase）

---

## 优先级分类

| 优先级 | 编号 | 说明 |
|--------|------|------|
| 🔴 高 | TD-12, TD-13, TD-14, TD-16, TD-19 | 潜在 Bug 和内存泄漏 |
| 🟡 中 | TD-01~08, TD-09, TD-11, TD-17~18, TD-21~23 | 死代码、性能、代码重复 |
| 🟢 低 | TD-10, TD-15, TD-20, TD-24~30 | 可访问性、CSS 规范、命名统一 |
