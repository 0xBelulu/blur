import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Test from "./pages/Test";
import Loading from "./pages/Loading";
import Result from "./pages/Result";
import { generateResult } from "./utils/blurEngine";

const screenOrder = ["landing", "test", "loading", "result"];
const LOADING_DURATION = 3500;

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

const pageTransition = { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] };

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [result, setResult] = useState(null);
  const [direction, setDirection] = useState(1);
  const loadingTimerRef = useRef(null);

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

    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      try {
        const generatedResult = generateResult(finalAnswers);
        setResult(generatedResult);
        navigate("result");
      } catch {
        navigate("landing");
      }
    }, LOADING_DURATION);
  }, [navigate]);

  const handleRestart = useCallback(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
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
            transition={pageTransition}
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
            transition={pageTransition}
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
            transition={pageTransition}
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
            transition={pageTransition}
          >
            <Result result={result} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
