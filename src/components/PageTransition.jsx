import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { PAGE_TRANSITION, PAGE_VARIANTS } from '../utils/pageTransitions';

export default function PageTransition({ children, direction }) {
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      custom={direction}
      variants={PAGE_VARIANTS}
      initial={reduceMotion ? false : 'enter'}
      animate="center"
      exit={reduceMotion ? undefined : 'exit'}
      transition={reduceMotion ? { duration: 0 } : PAGE_TRANSITION}
      inert={!isPresent}
      className="min-h-[100svh]"
      style={{ contain: 'layout style paint' }}
    >
      {children}
    </motion.div>
  );
}
