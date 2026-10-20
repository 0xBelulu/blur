import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import { questions } from "../data/questions";
import BlurCard from "../components/BlurCard";
import GlassButton from "../components/GlassButton";
import { solveProfile } from "../utils/blurEngine";
import { buildPersonaSymbols, revealAt } from "../utils/personaSymbols";

const REQUIRED_COUNT = 10;

// 作答草稿：72 题要十几分钟，刷新、崩溃、手机上被系统回收标签页都不该清零。
// 只放 sessionStorage —— 关掉标签页就该忘掉，这不是存档。
const DRAFT_KEY = 'blur.draft.v1';
const DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

function readDraft() {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || !Array.isArray(draft.order) || !Array.isArray(draft.answers)) return null;
    if (Date.now() - (draft.updatedAt || 0) > DRAFT_TTL_MS) return null;
    return draft;
  } catch { return null; }
}

function clearDraft() {
  try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* 无所谓 */ }
}

/**
 * 题目顺序必须一起存：answers 是按位置索引的，重新洗牌后再恢复会把
 * 上一题的答案挂到另一道题上——那比丢失更糟。
 */
function restoreOrder(draft) {
  if (!draft?.order) return null;
  const byId = new Map(questions.map((question) => [question.id, question]));
  const restored = draft.order.map((id) => byId.get(id));
  const valid = restored.length === questions.length && restored.every(Boolean);
  return valid ? restored : null;
}

function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleQuestions(questionList) {
  const single = fisherYatesShuffle(questionList.filter((q) => q.type === "single" || !q.type));
  const scale = fisherYatesShuffle(questionList.filter((q) => q.type === "scale"));
  const rank = fisherYatesShuffle(questionList.filter((q) => q.type === "rank"));

  // 必做题（前10题）：按简单 → 复杂排列
  const requiredSingle = Math.min(Math.round(REQUIRED_COUNT * 0.6), single.length);
  const requiredScale = Math.min(Math.round(REQUIRED_COUNT * 0.2), scale.length);
  const requiredRank = REQUIRED_COUNT - requiredSingle - requiredScale;

  const required = [
    ...single.slice(0, requiredSingle),
    ...scale.slice(0, requiredScale),
    ...rank.slice(0, requiredRank),
  ];

  // 探索题（剩余题目）：3:1:1 配比交错
  const remainingSingle = single.slice(requiredSingle);
  const remainingScale = scale.slice(requiredScale);
  const remainingRank = rank.slice(requiredRank);

  const exploratory = [];
  let s = 0,
    sc = 0,
    r = 0;
  const totalRemaining =
    remainingSingle.length + remainingScale.length + remainingRank.length;

  while (exploratory.length < totalRemaining) {
    for (let i = 0; i < 3 && s < remainingSingle.length; i++) {
      exploratory.push(remainingSingle[s++]);
    }
    if (sc < remainingScale.length) exploratory.push(remainingScale[sc++]);
    if (r < remainingRank.length) exploratory.push(remainingRank[r++]);
  }

  return [...required, ...exploratory];
}

export default function Test({ onComplete, onSymbolsChange, onExit }) {
  const [draft] = useState(readDraft);
  // 只有「题目顺序完整还原」时才能恢复答案：answers 是按位置索引的，
  // 题库变过（题目增减/改 id）就必须整份丢弃，否则会把上一题的答案挂到另一道题上。
  const restoredOrder = useMemo(() => restoreOrder(draft), [draft]);
  const restored = Boolean(restoredOrder);
  const shuffledQuestions = useMemo(
    () => restoredOrder || shuffleQuestions(questions),
    [restoredOrder],
  );

  const startIndex = restored
    ? Math.min(Math.max(draft?.currentIndex ?? 0, 0), shuffledQuestions.length - 1) : 0;
  const startAnswer = restored ? draft?.answers?.[startIndex] || null : null;
  const resumed = restored && draft.answers.some(Boolean);

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [answers, setAnswers] = useState(() => (restored ? draft.answers : []));
  const [selectedOption, setSelectedOption] = useState(() =>
    startAnswer?.type === "single" && startAnswer.optionId ? { id: startAnswer.optionId } : null);
  const [rankOrder, setRankOrder] = useState(() =>
    startAnswer?.type === "rank" ? startAnswer.rankOrder || [] : []);
  const [scaleValue, setScaleValue] = useState(() =>
    startAnswer?.type === "scale" ? startAnswer.value ?? null : null);
  const [isTransition, setIsTransition] = useState(false);
  const [hasShownTransition, setHasShownTransition] = useState(() =>
    restored ? Boolean(draft?.hasShownTransition) : false);
  const [showResume, setShowResume] = useState(resumed);

  const currentQuestion = shuffledQuestions[currentIndex] || shuffledQuestions[0];
  const isRankQuestion = currentQuestion?.type === "rank";
  const isScaleQuestion = currentQuestion?.type === "scale";

  // 有效作答题数
  const validAnswerCount = answers.filter(Boolean).length;
  const isUnlocked = validAnswerCount >= REQUIRED_COUNT;
  const isExplorePhase = hasShownTransition || isUnlocked;

  // 实时解算：背景 emoji 场的权重直接来自答案，与结果页共用同一套算法
  const profile = useMemo(() => solveProfile(answers), [answers]);
  const symbols = useMemo(
    () => buildPersonaSymbols(profile.field, revealAt(profile.answeredCount)),
    [profile],
  );
  // The persistent app background only updates when saved answers change.
  useEffect(() => { onSymbolsChange(symbols); }, [symbols, onSymbolsChange]);

  // 每答一题落一次草稿。写入失败（隐私模式、配额）不影响作答本身。
  useEffect(() => {
    if (!answers.some(Boolean)) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        order: shuffledQuestions.map((question) => question.id),
        answers, currentIndex, hasShownTransition, updatedAt: Date.now(),
      }));
    } catch { /* 草稿是尽力而为，丢了也只是回到原来的行为 */ }
  }, [answers, currentIndex, hasShownTransition, shuffledQuestions]);

  const restoreState = (answer, question) => {
    if (!answer || !question) {
      setSelectedOption(null);
      setRankOrder([]);
      setScaleValue(null);
      return;
    }

    if (question.type === "rank") {
      setRankOrder(answer.rankOrder || []);
      setSelectedOption(null);
      setScaleValue(null);
    } else if (question.type === "scale") {
      setScaleValue(answer.value ?? null);
      setSelectedOption(null);
      setRankOrder([]);
    } else {
      setSelectedOption(
        answer.optionId
          ? { id: answer.optionId }
          : null
      );
      setRankOrder([]);
      setScaleValue(null);
    }
  };

  const handleSelect = (option) => {
    setSelectedOption(option);
  };

  const handleRankClick = (optionIndex) => {
    setRankOrder((prev) => {
      const existingPos = prev.indexOf(optionIndex);
      if (existingPos !== -1) {
        return prev.slice(0, existingPos);
      }
      if (prev.length >= 4) return prev;
      const next = [...prev, optionIndex];
      if (next.length === 3 && currentQuestion?.options?.length === 4) {
        const remaining = [0, 1, 2, 3].find((idx) => !next.includes(idx));
        if (remaining !== undefined) next.push(remaining);
      }
      return next;
    });
  };

  const handleScaleSelect = (value) => {
    setScaleValue(value);
  };

  const finishTest = (finalAnswers) => {
    const valid = finalAnswers.filter(Boolean);
    clearDraft();
    onComplete(valid);
  };

  const restart = () => {
    clearDraft();
    setAnswers([]);
    setCurrentIndex(0);
    setHasShownTransition(false);
    setIsTransition(false);
    setSelectedOption(null);
    setRankOrder([]);
    setScaleValue(null);
    setShowResume(false);
  };

  const buildAnswer = (question, currentRankOrder, currentScaleValue, currentSelectedOption) => {
    if (!question) return null;

    if (question.type === "rank") {
      if (currentRankOrder.length === 4) {
        return {
          questionId: question.id,
          type: "rank",
          rankOrder: currentRankOrder,
        };
      }
    } else if (question.type === "scale") {
      if (currentScaleValue !== null) {
        return {
          questionId: question.id,
          type: "scale",
          value: currentScaleValue,
        };
      }
    } else {
      if (currentSelectedOption) {
        return {
          questionId: question.id,
          type: "single",
          optionId: currentSelectedOption.id,
        };
      }
    }

    return null;
  };

  const canProceed = () => {
    if (isRankQuestion) return rankOrder.length === 4;
    if (isScaleQuestion) return scaleValue !== null;
    return !!selectedOption;
  };

  const handleNext = () => {
    if (isTransition) return;

    const newAnswer = buildAnswer(currentQuestion, rankOrder, scaleValue, selectedOption);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = newAnswer;
    setAnswers(newAnswers);

    const newValidCount = newAnswers.filter(Boolean).length;

    // 当回答满最低题数且未曾弹出过渡页时，展示“已获得基本画像”
    if (newValidCount >= REQUIRED_COUNT && !hasShownTransition) {
      setHasShownTransition(true);
      setIsTransition(true);
      return;
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      restoreState(newAnswers[nextIndex], shuffledQuestions[nextIndex]);
    } else {
      finishTest(newAnswers);
    }
  };

  const handleSkip = () => {
    if (isTransition) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = null;
    setAnswers(newAnswers);

    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      restoreState(newAnswers[nextIndex], shuffledQuestions[nextIndex]);
    } else {
      // 已经到最后一题
      const validCount = newAnswers.filter(Boolean).length;
      if (validCount >= REQUIRED_COUNT) {
        finishTest(newAnswers);
      } else {
        const firstUnansweredIndex = shuffledQuestions.findIndex((_, idx) => !newAnswers[idx]);
        if (firstUnansweredIndex !== -1 && firstUnansweredIndex !== currentIndex) {
          setCurrentIndex(firstUnansweredIndex);
          restoreState(newAnswers[firstUnansweredIndex], shuffledQuestions[firstUnansweredIndex]);
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      restoreState(answers[prevIndex], shuffledQuestions[prevIndex]);
    }
  };

  const handleSeeResult = () => {
    const currentAnswer = (!isTransition && canProceed()) ? buildAnswer(currentQuestion, rankOrder, scaleValue, selectedOption) : null;
    const newAnswers = [...answers];
    if (currentAnswer) {
      newAnswers[currentIndex] = currentAnswer;
    }
    finishTest(newAnswers);
  };

  const handleContinueExplore = () => {
    setIsTransition(false);
    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      restoreState(answers[nextIndex], shuffledQuestions[nextIndex]);
    } else {
      finishTest(answers);
    }
  };

  const keyStateRef = useRef({});
  useEffect(() => {
    keyStateRef.current = {
      isTransition, isScaleQuestion, isRankQuestion, currentQuestion,
      canProceed, handleNext, handlePrev, handleSelect, handleRankClick,
      currentIndex,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = keyStateRef.current;
      if (s.isTransition) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;

      if (s.isScaleQuestion) {
        if (["1", "2", "3", "4", "5"].includes(key)) {
          setScaleValue(Number(key));
          return;
        }
      } else if (s.isRankQuestion) {
        if (["1", "2", "3", "4"].includes(key)) {
          s.handleRankClick(Number(key) - 1);
          return;
        }
      } else if (s.currentQuestion?.options) {
        const optionKeys = ["a", "b", "c", "d"];
        const numberKeys = ["1", "2", "3", "4"];
        const lowerKey = key.toLowerCase();

        let optIndex = optionKeys.indexOf(lowerKey);
        if (optIndex === -1) optIndex = numberKeys.indexOf(key);

        if (optIndex >= 0 && optIndex < s.currentQuestion.options.length) {
          s.handleSelect(s.currentQuestion.options[optIndex]);
          return;
        }
      }

      if (key === "Enter" && s.canProceed()) {
        e.preventDefault();
        s.handleNext();
      } else if (key === "ArrowLeft" && s.currentIndex > 0) {
        e.preventDefault();
        s.handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getQuestionLabel = () => (isExplorePhase ? "探索模式" : "捕捉中");

  const getNextButtonText = () => {
    if (currentIndex === shuffledQuestions.length - 1) return "完成探索";
    return "下一题";
  };

  return (
    <>
      <div className="relative z-10 flex-1 flex flex-col px-6 py-8 min-h-[100svh] max-w-lg mx-auto w-full">

        {/* 恢复草稿时说清楚「这是上次的进度」，并给一个反悔的出口 */}
        {showResume && !isTransition && currentIndex === startIndex && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-blur-border/70 bg-white/40 px-3.5 py-2.5">
            <span className="text-[11px] text-blur-text-muted">
              已恢复上次作答 · 第 {currentIndex + 1} 题
            </span>
            <button
              type="button"
              onClick={restart}
              className="text-[11px] text-blur-accent hover:underline cursor-pointer shrink-0"
            >
              重新开始
            </button>
          </div>
        )}

        {/* 进度与特征捕捉提示 */}
        {!isTransition && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs text-blur-text-muted flex items-center gap-1.5">
                {isUnlocked ? (
                  <>
                    <Sparkles size={13} className="text-blur-accent" />
                    <span className="text-blur-accent font-medium">基本画像已就绪</span>
                    <span>· 已收集 {validAnswerCount} 个特征</span>
                  </>
                ) : (
                  <>
                    <span>已捕捉特征</span>
                    <span className="text-blur-text font-medium">{validAnswerCount} / {REQUIRED_COUNT}</span>
                  </>
                )}
              </span>
              <span className="text-[11px] text-blur-text-light tabular-nums">
                {isUnlocked ? "可随时结束" : `第 ${currentIndex + 1} 题`}
              </span>
            </div>

            {/* 十段式进度：每答一题点亮一格，比连续进度条更像"正在被记录" */}
            <div className="flex gap-1.5">
              {Array.from({ length: REQUIRED_COUNT }).map((_, i) => {
                const filled = i < validAnswerCount;
                return (
                  <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-blur-border/50">
                    <div
                      className="h-full w-full rounded-full bg-gradient-to-r from-blur-accent to-blur-accent-cool transition-all duration-500 ease-out"
                      style={{
                        transform: filled ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isTransition ? (
            <motion.div
              key="transition"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ willChange: "transform, opacity" }}
              className="flex-1 flex flex-col items-center justify-center text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full glass-strong flex items-center justify-center mb-6"
              >
                <Sparkles size={28} className="text-blur-accent" />
              </motion.div>

              <h2 className="text-2xl font-medium text-blur-text mb-3">
                已获得基本画像
              </h2>
              <p className="text-sm text-blur-text-muted leading-relaxed mb-2 max-w-xs">
                你已完成 {REQUIRED_COUNT} 道有效作答，基础画像已经成型。
              </p>
              <p className="text-sm text-blur-text-muted leading-relaxed mb-8 max-w-xs">
                你可以现在就查看结果，也可以继续探索更多维度，让画像更细腻。
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <GlassButton
                  onClick={handleSeeResult}
                  className="flex items-center justify-center gap-2"
                >
                  查看我的画像
                  <ChevronRight size={16} />
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={handleContinueExplore}
                  className="flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  继续探索更多
                </GlassButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`question-${currentQuestion.id}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{ willChange: "transform, opacity" }}
              className="flex-1 flex flex-col"
            >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                  <Eye size={16} className="text-blur-accent" />
                  <span className="text-xs text-blur-accent tracking-wider">
                    {getQuestionLabel()}
                  </span>
                </div>
              <h2 className="text-xl font-medium text-blur-text leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

              {isRankQuestion ? (
                <div className="space-y-2 mb-8">
                  <p className="text-xs text-blur-text-muted mb-3">
                    按顺序点击选项，从最像你的开始
                  </p>
                  {currentQuestion.options.map((option, optionIndex) => {
                    const rankPos = rankOrder.indexOf(optionIndex);
                    const isRanked = rankPos !== -1;
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        aria-pressed={isRanked}
                        aria-label={`选项 ${optionIndex + 1}: ${option.text}${isRanked ? ` (已排第${rankPos + 1})` : ""}`}
                        onClick={() => handleRankClick(optionIndex)}
                        className={`w-full text-left flex items-center gap-3 glass rounded-xl px-4 py-3 transition-all duration-300 cursor-pointer ${
                          isRanked
                            ? "border-blur-accent/50 bg-blur-accent/5 shadow-[0_0_12px_rgba(180,185,195,0.15)]"
                            : "hover:border-blur-text-muted/30"
                        }`}
                      >
                        <motion.span
                          key={isRanked ? `rank-${rankPos + 1}` : `empty-${option.id}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isRanked
                              ? "bg-blur-accent text-blur-bg"
                              : "bg-blur-surface/50 text-blur-text-muted border border-blur-border"
                          }`}
                        >
                          {isRanked ? rankPos + 1 : ""}
                        </motion.span>
                        <span
                          className={`flex-1 text-sm transition-colors ${
                            isRanked ? "text-blur-text" : "text-blur-text-muted"
                          }`}
                        >
                          {option.text}
                        </span>
                        {isRanked && (
                          <span className="text-xs text-blur-accent/60">
                            {rankPos === 0
                              ? "最像"
                              : rankPos === 3
                                ? "最不像"
                                : `第${rankPos + 1}`}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : isScaleQuestion ? (
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-blur-text-muted">完全不同意</span>
                    <span className="text-xs text-blur-text-muted">完全同意</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={scaleValue === value}
                        aria-label={`程度 ${value} (${value === 1 ? "完全不同意" : value === 5 ? "完全同意" : value})`}
                        onClick={() => handleScaleSelect(value)}
                        className={`flex-1 h-14 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-300 border-2 cursor-pointer ${
                          scaleValue === value
                            ? "border-blur-accent bg-blur-accent/20 text-blur-accent shadow-[0_0_16px_rgba(180,185,195,0.25)] scale-105"
                            : "border-blur-border/60 glass text-blur-text-muted hover:border-blur-text-muted/40 hover:bg-blur-surface-hover"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option) => (
                    <BlurCard
                      key={option.id}
                      option={option}
                      isSelected={selectedOption?.id === option.id}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-auto pt-2">
                {/* 第一题没有上一题可退，同一个按钮位改为返回起点，保持底部布局一致 */}
                <GlassButton
                  variant="secondary"
                  onClick={currentIndex > 0 ? handlePrev : onExit}
                  className="flex items-center gap-1 text-xs"
                >
                  <ChevronLeft size={15} />
                  {currentIndex > 0 ? "上一题" : "返回"}
                </GlassButton>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-blur-text-muted hover:text-blur-text transition-colors px-2.5 py-2 cursor-pointer"
                >
                  跳过此题
                </button>

                {isUnlocked && (
                  <GlassButton
                    variant="ghost"
                    onClick={handleSeeResult}
                    className="flex items-center gap-1 text-xs text-blur-accent"
                  >
                    查看结果
                  </GlassButton>
                )}

                <GlassButton
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  {getNextButtonText()}
                  <ChevronRight size={16} />
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
