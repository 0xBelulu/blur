import { memo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AtmosphereField from './AtmosphereField';
import OpticalStage from './optical/OpticalStage';
import { PAGE_BACKGROUND_PRESETS, LANDING_PRESET, TEST_PRESET } from './optical/presets';
import { SPATIAL_SYMBOLS } from './optical/symbols';
import { BACKGROUND_VARIANTS, PAGE_TRANSITION } from '../utils/pageTransitions';

// This tree deliberately lives outside AnimatePresence and the page's filter.
// Navigation changes the scene, never the lifetime of the atmosphere/optical engine.
export default memo(function AppBackground({ screen, present, testSymbols, opacity }) {
  const reduceMotion = useReducedMotion();
  const scene = PAGE_BACKGROUND_PRESETS[screen] || PAGE_BACKGROUND_PRESETS.plain;
  const optical = scene.optical;
  const [opticalScene, setOpticalScene] = useState(optical || 'landing');
  // Retain the outgoing symbols during its fade instead of swapping hidden scenes.
  if (optical && optical !== opticalScene) setOpticalScene(optical);
  return (
    <motion.div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ opacity }}>
      <div className="app-background-layer" data-visible={scene.atmosphere > 0}>
        <AtmosphereField intensity={scene.atmosphere} />
      </div>
      {/* The wash is already diffuse. Blur the detailed symbols/dust once as a
          group, leaving the large watercolor textures and dither untouched. */}
      <motion.div
        className="app-background-layer"
        data-visible={!!optical}
        inert={!optical}
        initial={false}
        variants={BACKGROUND_VARIANTS}
        animate={reduceMotion || present ? 'center' : 'exit'}
        transition={reduceMotion ? { duration: 0 } : PAGE_TRANSITION}
        style={{ willChange: 'filter' }}
      >
        <OpticalStage
          active={!!optical}
          preset={opticalScene === 'test' ? TEST_PRESET : LANDING_PRESET}
          symbols={opticalScene === 'test' ? testSymbols : SPATIAL_SYMBOLS}
        />
      </motion.div>
      <div className="app-background-layer" data-visible={scene.wash === 'catalog'}>
        <div className="absolute top-[14%] left-[8%] w-40 h-40 rounded-full bg-blur-accent/8 blur-3xl"
          style={{ animation: 'orb-scale-1 11s ease-in-out infinite' }} />
        <div className="absolute bottom-[16%] right-[10%] w-48 h-48 rounded-full bg-blur-accent-cool/8 blur-3xl"
          style={{ animation: 'orb-scale-2 13s ease-in-out infinite' }} />
      </div>
      <div className="app-background-layer" data-visible={scene.wash === 'loading'}>
        <div className="absolute top-[15%] left-[12%] w-48 h-48 rounded-full bg-blur-accent/6 blur-3xl animate-breathe-slow" />
        <div className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full bg-blur-accent-cool/6 blur-3xl animate-breathe-slow"
          style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] right-[30%] w-32 h-32 rounded-full bg-blur-accent-warm/5 blur-3xl animate-breathe-slow"
          style={{ animationDelay: '3s' }} />
      </div>
    </motion.div>
  );
});
