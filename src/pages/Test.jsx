import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import { questions } from "../data/questions";
import BlurCard from "../components/BlurCard";
import GlassButton from "../components/GlassButton";

const REQUIRED_COUNT = 10;

function shuffleQuestions(questionList) {
  const single = questionList
    .filter((q) => q.type === "single" || !q.type)
    .sort(() => Math.random() - 0.5);
  const scale = questionList
    .filter((q) => q.type === "scale")
    .sort(() => Math.random() - 0.5);
  const rank = questionList
    .filter((q) => q.type === "rank")
    .sort(() => Math.random() - 0.5);

  // 必做题（前10题）：按简单 → 复杂排列
  const requiredSingle = Math.min(Math.round(REQUIRED_COUNT * 0.6), single.length);
  const requiredScale = Math.min(Math.round(REQUIRED_COUNT * 0.2), scale.length);
  const requiredRank = REQUIRED_COUNT - requiredSingle - requiredScale;

  const required = [
    ...single.slice(0, requiredSingle),
    ...scale.slice(0, requiredScale),
    ...rank.slice(0, requiredRank),
  ];

  // 探索题（剩余30题）：3:1:1 配比交错
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

export default function Test({ onComplete }) {
  const shuffledQuestions = useMemo(() => shuffleQuestions(questions), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [rankOrder, setRankOrder] = useState([]);
  const [scaleValue, setScaleValue] = useState(null);
  const [isTransition, setIsTransition] = useState(false);
  const [hasShownTransition, setHasShownTransition] = useState(false);

  const currentQuestion = shuffledQuestions[currentIndex] || shuffledQuestions[0];
  const isRankQuestion = currentQuestion?.type === "rank";
  const isScaleQuestion = currentQuestion?.type === "scale";

  // 有效作答题数
  const validAnswerCount = answers.filter(Boolean).length;
  const isUnlocked = validAnswerCount >= REQUIRED_COUNT;
  const isExplorePhase = hasShownTransition || isUnlocked;

  const progressPct = Math.min(100, Math.round((validAnswerCount / REQUIRED_COUNT) * 100));

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
      return [...prev, optionIndex];
    });
  };

  const handleScaleSelect = (value) => {
    setScaleValue(value);
  };

  const finishTest = (finalAnswers) => {
    const valid = finalAnswers.filter(Boolean);
    onComplete(valid);
  };

  const buildAnswer = (question, currentRankOrder, currentScaleValue, currentSelectedOption) => {
    if (!question) return null;

    if (question.type === "rank") {
      if (currentRankOrder.length > 0) {
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
      if (newAnswers.filter(Boolean).length >= REQUIRED_COUNT) {
        finishTest(newAnswers);
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
    const currentAnswer = isTransition ? null : buildAnswer(currentQuestion, rankOrder, scaleValue, selectedOption);
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

  const getQuestionLabel = () => {
    if (isExplorePhase) return `探索模式 · 第 ${currentIndex + 1} 题`;
    return `第 ${currentIndex + 1} 题`;
  };

  const getNextButtonText = () => {
    if (currentIndex === shuffledQuestions.length - 1) return "完成探索";
    return "下一题";
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
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
              第 {currentIndex + 1} / {shuffledQuestions.length} 题
            </span>
          </div>
          <div className="h-1 bg-blur-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blur-accent to-blur-accent-cool rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isTransition ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 30, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(3px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ willChange: "filter, transform, opacity" }}
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
            initial={{ opacity: 0, x: 40, filter: "blur(3px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40, filter: "blur(3px)" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ willChange: "filter, transform, opacity" }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={16} className="text-blur-accent" />
                <span className="text-xs text-blur-accent tracking-wider">
                  {getQuestionLabel()}
                </span>
                {isExplorePhase && (
                  <span className="text-xs text-blur-text-muted ml-auto">
                    随时可结束
                  </span>
                )}
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
                      onClick={() => handleRankClick(optionIndex)}
                      className={`w-full text-left flex items-center gap-3 glass rounded-xl px-4 py-3 transition-all duration-300 ${
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
                      onClick={() => handleScaleSelect(value)}
                      className={`flex-1 h-14 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-300 border-2 ${
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
              {currentIndex > 0 && (
                <GlassButton
                  variant="secondary"
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-xs"
                >
                  <ChevronLeft size={15} />
                  上一题
                </GlassButton>
              )}

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
  );
}
