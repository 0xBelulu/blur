import { memo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AtmosphereField from './AtmosphereField';
import OpticalStage from './optical/OpticalStage';
import SkyField from './optical/SkyField';
import { PAGE_BACKGROUND_PRESETS, LANDING_PRESET, TEST_PRESET } from './optical/presets';
import { SPATIAL_SYMBOLS } from './optical/symbols';
import { BACKGROUND_VARIANTS, PAGE_TRANSITION } from '../utils/pageTransitions';
import { ACCENT, SKY, GOLD, rgba } from '../utils/palette.js';

// This tree deliberately lives outside AnimatePresence and the page's filter.
// Navigation changes the scene, never the lifetime of the atmosphere/optical engine.
export default memo(function AppBackground({ screen, present, testSymbols, opacity }) {
  const reduceMotion = useReducedMotion();
  const scene = PAGE_BACKGROUND_PRESETS[screen] || PAGE_BACKGROUND_PRESETS.plain;
  const optical = scene.optical;
  // sky 是强度（数字）而不是开关：阅读页只留一点星，下一步页才铺满。
  const skyOpacity = typeof scene.sky === 'number' ? scene.sky : scene.sky ? 1 : 0;
  const [opticalScene, setOpticalScene] = useState(optical || 'landing');
  // Retain the outgoing symbols during its fade instead of swapping hidden scenes.
  if (optical && optical !== opticalScene) setOpticalScene(optical);
  return (
    <motion.div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ opacity }}>
      <div className="app-background-layer" data-visible={scene.atmosphere > 0}>
        <AtmosphereField intensity={scene.atmosphere} />
      </div>
      {/* 下一步页的星场：跟着指针亮起来，页面滚动时保持不动。
          阅读页也用它，但只压到 0.4 左右——星星负责"不空"，不负责"热闹"。 */}
      <div className="app-background-layer" data-visible={!!scene.sky}>
        <div className="absolute inset-0" style={{ opacity: skyOpacity }}>
          <SkyField active={!!scene.sky} />
        </div>
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
      {/* 列表页的三处光斑：给大片留白一点结构，否则整页会读成"没做背景" */}
      <div className="app-background-layer" data-visible={scene.wash === 'catalog'}>
        <div className="absolute left-[4%] top-[9%] h-80 w-80 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${rgba(ACCENT, 0.26)} 0%, transparent 68%)`, animation: 'orb-scale-1 11s ease-in-out infinite' }} />
        <div className="absolute bottom-[10%] right-[5%] h-96 w-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${rgba(SKY, 0.24)} 0%, transparent 66%)`, animation: 'orb-scale-2 13s ease-in-out infinite' }} />
        <div className="absolute right-[26%] top-[44%] h-56 w-56 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${rgba(GOLD, 0.24)} 0%, transparent 62%)`, animation: 'orb-scale-4 15s ease-in-out infinite' }} />
      </div>
      <div className="app-background-layer" data-visible={scene.wash === 'loading'}>
        <div className="absolute top-[15%] left-[12%] w-48 h-48 rounded-full blur-3xl animate-breathe-slow"
          style={{ background: `radial-gradient(circle, ${rgba(ACCENT, 0.2)} 0%, transparent 66%)` }} />
        <div className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full blur-3xl animate-breathe-slow"
          style={{ background: `radial-gradient(circle, ${rgba(SKY, 0.18)} 0%, transparent 64%)`, animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] right-[30%] w-40 h-40 rounded-full blur-3xl animate-breathe-slow"
          style={{ background: `radial-gradient(circle, ${rgba(GOLD, 0.16)} 0%, transparent 60%)`, animationDelay: '3s' }} />
      </div>
    </motion.div>
  );
});
