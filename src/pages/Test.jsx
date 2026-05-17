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

  const currentQuestion = shuffledQuestions[currentIndex];
  const isRankQuestion = currentQuestion?.type === "rank";
  const isScaleQuestion = currentQuestion?.type === "scale";
  const isRequiredPhase = currentIndex < REQUIRED_COUNT;
  const isTransition = currentIndex === REQUIRED_COUNT;
  const isExplorePhase = currentIndex > REQUIRED_COUNT;

  const progress = isRequiredPhase
    ? ((currentIndex + 1) / REQUIRED_COUNT) * 100
    : 0;

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
          ? { id: answer.optionId, traits: answer.traits }
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

  const handleNext = () => {
    if (isTransition) return;

    // 必做阶段必须回答
    if (isRequiredPhase) {
      if (isRankQuestion && rankOrder.length < 4) return;
      if (isScaleQuestion && scaleValue === null) return;
      if (!isRankQuestion && !isScaleQuestion && !selectedOption) return;
    }

    // 构建答案
    let newAnswer = null;
    if (isRankQuestion) {
      if (rankOrder.length > 0) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "rank",
          rankOrder,
          options: currentQuestion.options,
        };
      }
    } else if (isScaleQuestion) {
      if (scaleValue !== null) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "scale",
          value: scaleValue,
          traits: currentQuestion.traits,
        };
      }
    } else {
      if (selectedOption) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "single",
          optionId: selectedOption.id,
          traits: selectedOption.traits,
        };
      }
    }

    const newAnswers = [...answers];
    newAnswers[currentIndex] = newAnswer;
    setAnswers(newAnswers);

    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      restoreState(newAnswers[nextIndex], shuffledQuestions[nextIndex]);
    } else {
      finishTest(newAnswers);
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
    // 保存当前答案（如果有）
    let newAnswer = null;
    if (!isTransition && currentQuestion) {
      if (isRankQuestion && rankOrder.length > 0) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "rank",
          rankOrder,
          options: currentQuestion.options,
        };
      } else if (isScaleQuestion && scaleValue !== null) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "scale",
          value: scaleValue,
          traits: currentQuestion.traits,
        };
      } else if (selectedOption) {
        newAnswer = {
          questionId: currentQuestion.id,
          type: "single",
          optionId: selectedOption.id,
          traits: selectedOption.traits,
        };
      }
    }

    const newAnswers = [...answers];
    if (newAnswer) {
      newAnswers[currentIndex] = newAnswer;
    }
    finishTest(newAnswers);
  };

  const handleContinueExplore = () => {
    const nextIdx = REQUIRED_COUNT + 1;
    if (nextIdx >= shuffledQuestions.length) {
      finishTest(answers);
      return;
    }
    setCurrentIndex(nextIdx);
    restoreState(answers[nextIdx], shuffledQuestions[nextIdx]);
  };

  const canProceed = () => {
    if (!isRequiredPhase) return true;
    if (isRankQuestion) return rankOrder.length === 4;
    if (isScaleQuestion) return scaleValue !== null;
    return !!selectedOption;
  };

  const getQuestionLabel = () => {
    if (isRequiredPhase) return `第 ${currentIndex + 1} 题`;
    if (isExplorePhase) return `继续探索 · 第 ${currentIndex + 1} 题`;
    return "";
  };

  const getNextButtonText = () => {
    if (currentIndex === REQUIRED_COUNT - 1) return "完成基本题";
    if (currentIndex === shuffledQuestions.length - 1) return "查看结果";
    return "下一题";
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
      {/* 进度条 - 仅在必做阶段显示 */}
      {isRequiredPhase && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-blur-text-muted">
              {currentIndex + 1} / {REQUIRED_COUNT}
            </span>
            <span className="text-xs text-blur-text-light">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 bg-blur-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blur-accent to-blur-accent-cool rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 探索阶段简洁提示 */}
      {isExplorePhase && (
        <div className="mb-6 flex items-center gap-2">
          <Sparkles size={14} className="text-blur-accent" />
          <span className="text-xs text-blur-text-muted">
            已获得基本画像 · 继续探索中
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isTransition ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col items-center justify-center text-center"
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
              你的基础画像已经成型，但还有一些更深层的问题——
            </p>
            <p className="text-sm text-blur-text-muted leading-relaxed mb-8 max-w-xs">
              继续探索可以让结果更精准，也可以现在就查看结果。
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <GlassButton
                onClick={handleContinueExplore}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                继续探索
              </GlassButton>
              <GlassButton
                variant="ghost"
                onClick={handleSeeResult}
                className="flex items-center justify-center gap-2"
              >
                查看结果
                <ChevronRight size={16} />
              </GlassButton>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`question-${currentQuestion.id}`}
            initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
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

            <div className="flex gap-3 mt-auto">
              {currentIndex > 0 && (
                <GlassButton
                  variant="secondary"
                  onClick={handlePrev}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  上一题
                </GlassButton>
              )}

              {isExplorePhase && (
                <GlassButton
                  variant="ghost"
                  onClick={handleSeeResult}
                  className="flex items-center gap-1"
                >
                  查看结果
                </GlassButton>
              )}

              <GlassButton
                onClick={handleNext}
                disabled={isRequiredPhase && !canProceed()}
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
