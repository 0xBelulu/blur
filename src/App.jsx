import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Test from "./pages/Test";
import Loading from "./pages/Loading";
import Result from "./pages/Result";
import { generateResult } from "./utils/blurEngine";

const screenOrder = ["landing", "test", "loading", "result"];

const pageVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
    scale: 0.97,
    filter: "blur(4px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    scale: 0.97,
    filter: "blur(4px)",
  }),
};

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [result, setResult] = useState(null);
  const [direction, setDirection] = useState(1);

  const navigate = useCallback((nextScreen) => {
    setDirection(screenOrder.indexOf(nextScreen) > screenOrder.indexOf(screen) ? 1 : -1);
    setScreen(nextScreen);
  }, [screen]);

  const handleStart = useCallback(() => {
    navigate("test");
    setResult(null);
  }, [navigate]);

  const handleComplete = useCallback((finalAnswers) => {
    navigate("loading");

    setTimeout(() => {
      const generatedResult = generateResult(finalAnswers);
      setResult(generatedResult);
      setDirection(1);
      setScreen("result");
    }, 3500);
  }, [navigate]);

  const handleRestart = useCallback(() => {
    navigate("landing");
    setResult(null);
  }, [navigate]);

  return (
    <div className="min-h-[100svh] bg-blur-bg">
      <AnimatePresence mode="wait" custom={direction}>
        {screen === "landing" && (
          <motion.div
            key="landing"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Landing onStart={handleStart} />
          </motion.div>
        )}

        {screen === "test" && (
          <motion.div
            key="test"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Test onComplete={handleComplete} />
          </motion.div>
        )}

        {screen === "loading" && (
          <motion.div
            key="loading"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Loading />
          </motion.div>
        )}

        {screen === "result" && result && (
          <motion.div
            key="result"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Result result={result} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
