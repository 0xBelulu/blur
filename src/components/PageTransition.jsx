import { useLayoutEffect } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { PAGE_TRANSITION, PAGE_VARIANTS } from '../utils/pageTransitions';

export default function PageTransition({ children, direction, screen, onTransition, opacity }) {
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion();

  // In wait mode the route intent changes before the next page mounts. Commit
  // its background here so the outgoing page keeps its scene until it exits.
  useLayoutEffect(() => { onTransition(screen, isPresent); }, [screen, isPresent, onTransition]);

  return (
    <motion.div
      custom={direction}
      variants={PAGE_VARIANTS}
      initial={reduceMotion ? false : 'enter'}
      animate="center"
      exit={reduceMotion ? undefined : 'exit'}
      transition={reduceMotion ? { duration: 0 } : PAGE_TRANSITION}
      inert={!isPresent}
      className="relative z-10 min-h-[100svh]"
      style={{ opacity, contain: 'layout style paint' }}
    >
      {children}
    </motion.div>
  );
}
