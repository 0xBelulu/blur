import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Test from "./pages/Test";
import Loading from "./pages/Loading";
import Result from "./pages/Result";
import { generateResult } from "./utils/blurEngine";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const handleStart = useCallback(() => {
    setScreen("test");
    setAnswers([]);
    setResult(null);
  }, []);

  const handleComplete = useCallback((finalAnswers) => {
    setAnswers(finalAnswers);
    setScreen("loading");
    
    // Simulate processing delay for effect
    setTimeout(() => {
      const generatedResult = generateResult(finalAnswers);
      setResult(generatedResult);
      setScreen("result");
    }, 3500);
  }, []);

  const handleRestart = useCallback(() => {
    setScreen("landing");
    setAnswers([]);
    setResult(null);
  }, []);

  return (
    <div className="min-h-[100svh] bg-blur-bg">
      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Landing onStart={handleStart} />
          </motion.div>
        )}

        {screen === "test" && (
          <motion.div
            key="test"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Test onComplete={handleComplete} />
          </motion.div>
        )}

        {screen === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Loading />
          </motion.div>
        )}

        {screen === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Result result={result} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
