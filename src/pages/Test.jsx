import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles, SkipForward } from "lucide-react";
import { questions } from "../data/questions";
import BlurCard from "../components/BlurCard";
import GlassButton from "../components/GlassButton";

const requiredQuestions = questions.filter((q) => q.required);
const optionalQuestions = questions.filter((q) => !q.required);

export default function Test({ onComplete }) {
  const [phase, setPhase] = useState("required");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const currentList = phase === "required" ? requiredQuestions : optionalQuestions;
  const currentQuestion = currentList[currentIndex];

  const requiredProgress = phase === "required"
    ? ((currentIndex + 1) / requiredQuestions.length) * 100
    : 100;

  const optionalProgress = phase === "optional"
    ? ((currentIndex + 1) / optionalQuestions.length) * 100
    : 0;

  const handleSelect = (option) => {
    setSelectedOption(option);
  };

  const finishTest = (finalAnswers) => {
    const valid = finalAnswers.filter(Boolean);
    onComplete(valid);
  };

  const handleNext = () => {
    if (!selectedOption && phase === "required") return;

    const newAnswer = selectedOption
      ? {
          questionId: currentQuestion.id,
          optionId: selectedOption.id,
          traits: selectedOption.traits,
        }
      : null;

    const newAnswers = [...answers];
    const globalIndex = phase === "required"
      ? currentIndex
      : requiredQuestions.length + currentIndex;
    newAnswers[globalIndex] = newAnswer;
    setAnswers(newAnswers);

    if (currentIndex < currentList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextGlobalIndex = phase === "required"
        ? currentIndex + 1
        : requiredQuestions.length + currentIndex + 1;
      const nextPrev = newAnswers[nextGlobalIndex];
      setSelectedOption(
        nextPrev ? { id: nextPrev.optionId, traits: nextPrev.traits } : null
      );
    } else if (phase === "required") {
      setPhase("transition");
    } else {
      finishTest(newAnswers);
    }
  };

  const handleSkip = () => {
    const newAnswers = [...answers];
    const globalIndex = requiredQuestions.length + currentIndex;
    newAnswers[globalIndex] = null;
    setAnswers(newAnswers);

    if (currentIndex < optionalQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      finishTest(newAnswers);
    }
  };

  const handlePrev = () => {
    if (phase === "optional" && currentIndex === 0) {
      setPhase("transition");
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const prevGlobalIndex = phase === "required"
        ? currentIndex - 1
        : requiredQuestions.length + currentIndex - 1;
      const prevAnswer = answers[prevGlobalIndex];
      setSelectedOption(
        prevAnswer ? { id: prevAnswer.optionId, traits: prevAnswer.traits } : null
      );
    }
  };

  const handleContinueExplore = () => {
    setPhase("optional");
    setCurrentIndex(0);
    setSelectedOption(null);
  };

  const handleSeeResult = () => {
    finishTest(answers);
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
      {phase !== "transition" && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-blur-text-muted">
              {phase === "required"
                ? `${currentIndex + 1} / ${requiredQuestions.length}`
                : `探索题 ${currentIndex + 1} / ${optionalQuestions.length}`}
            </span>
            <span className="text-xs text-blur-text-light">
              {phase === "required"
                ? `${Math.round(requiredProgress)}%`
                : `+${currentIndex + 1}`}
            </span>
          </div>
          <div className="h-1 bg-blur-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blur-accent to-blur-accent-cool rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: phase === "required"
                  ? `${requiredProgress}%`
                  : `${(requiredProgress * (0.6 + 0.4 * optionalProgress / 100))}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "transition" ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
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
              核心题已完成
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
            key={`${phase}-${currentQuestion.id}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                {phase === "optional" ? (
                  <Sparkles size={16} className="text-blur-accent" />
                ) : (
                  <Eye size={16} className="text-blur-accent" />
                )}
                <span className="text-xs text-blur-accent tracking-wider">
                  {phase === "required"
                    ? `第 ${currentIndex + 1} 题`
                    : `探索题 ${currentIndex + 1}`}
                </span>
                {phase === "optional" && (
                  <span className="text-xs text-blur-text-muted ml-auto">
                    可跳过
                  </span>
                )}
              </div>
              <h2 className="text-xl font-medium text-blur-text leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, i) => (
                <BlurCard
                  key={option.id}
                  option={option}
                  index={i}
                  isSelected={selectedOption?.id === option.id}
                  onClick={() => handleSelect(option)}
                />
              ))}
            </div>

            <div className="flex gap-3 mt-auto">
              {!(phase === "required" && currentIndex === 0) && (
                <GlassButton
                  variant="secondary"
                  onClick={handlePrev}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  上一题
                </GlassButton>
              )}

              {phase === "optional" && (
                <GlassButton
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex items-center gap-1"
                >
                  <SkipForward size={16} />
                  跳过
                </GlassButton>
              )}

              <GlassButton
                onClick={handleNext}
                disabled={phase === "required" && !selectedOption}
                className="flex-1 flex items-center justify-center gap-1"
              >
                {phase === "required" && currentIndex === requiredQuestions.length - 1
                  ? "完成核心题"
                  : phase === "optional" && currentIndex === optionalQuestions.length - 1
                    ? "查看结果"
                    : "下一题"}
                <ChevronRight size={16} />
              </GlassButton>
            </div>

            {phase === "optional" && (
              <div className="mt-4 flex justify-center">
                <GlassButton
                  variant="ghost"
                  onClick={handleSeeResult}
                  className="text-xs"
                >
                  不想继续了，查看结果
                </GlassButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
