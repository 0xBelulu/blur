import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { questions } from "../data/questions";
import BlurCard from "../components/BlurCard";
import GlassButton from "../components/GlassButton";

export default function Test({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  const handleSelect = (option) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption) return;

    const newAnswer = {
      questionId: currentQuestion.id,
      optionId: selectedOption.id,
      traits: selectedOption.traits,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      onComplete(newAnswers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOption(answers[currentIndex - 1] || null);
      setAnswers(answers.slice(0, -1));
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-blur-text-muted">
            {currentIndex + 1} / {questions.length}
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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          {/* Question */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={16} className="text-blur-accent" />
              <span className="text-xs text-blur-accent tracking-wider">
                第 {currentIndex + 1} 题
              </span>
            </div>
            <h2 className="text-xl font-medium text-blur-text leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Options */}
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

          {/* Navigation */}
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
            
            <GlassButton
              onClick={handleNext}
              disabled={!selectedOption}
              className="flex-1 flex items-center justify-center gap-1"
            >
              {currentIndex === questions.length - 1 ? "查看结果" : "下一题"}
              <ChevronRight size={16} />
            </GlassButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
