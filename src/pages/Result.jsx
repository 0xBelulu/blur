import { useRef } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import CloudCanvas from "../components/CloudCanvas";
import TagParticles from "../components/TagParticles";
import ShareButton from "../components/ShareButton";
import GlassButton from "../components/GlassButton";

export default function Result({ result, onRestart }) {
  const captureRef = useRef(null);

  const { archetype, tags, clarity, cloudData } = result;

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
      {/* Capture Area */}
      <div ref={captureRef} className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4"
          >
            <Sparkles size={12} className="text-blur-accent" />
            <span className="text-xs text-blur-text-muted tracking-wider">
              测试结果
            </span>
          </div>

          <motion.h1
            className="text-3xl font-medium text-blur-text mb-2"
            animate={{ filter: [`blur(${3 - clarity * 2}px)`] }}
            transition={{ duration: 1.5 }}
          >
            {archetype.title}
          </motion.h1>
          
          <p className="text-sm text-blur-text-muted"
          >
            清晰度：{Math.round(clarity * 100)}%
          </p>
        </motion.div>

        {/* Cloud Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative w-[280px] h-[280px] mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-full glass-strong overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center"
            >
              <CloudCanvas
                cloudData={cloudData}
                width={280}
                height={280}
              />
            </div>
            
            <div className="absolute inset-0"
            >
              <TagParticles
                tags={tags}
                positions={cloudData.tagPositions}
              />
            </div>
          </div>
          
          {/* Glow effect */}
          <div 
            className="absolute -inset-4 rounded-full opacity-30 blur-2xl -z-10"
            style={{
              background: `radial-gradient(circle, rgba(155,142,199,0.3) 0%, transparent 70%)`,
            }}
          />
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="px-3 py-1.5 rounded-full text-xs text-blur-text glass"
              style={{
                filter: `blur(${Math.max(0, 1.5 - i * 0.3)}px)`,
              }}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <p className="text-sm text-blur-text leading-relaxed"
          >
            {archetype.description}
          </p>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="space-y-4"
      >
        <ShareButton targetRef={captureRef} />
        
        <div className="flex justify-center">
          <GlassButton variant="ghost" onClick={onRestart}>
            <span className="flex items-center gap-2">
              <RotateCcw size={14} />
              再测一次
            </span>
          </GlassButton>
        </div>
        
        <p className="text-center text-xs text-blur-text-light mt-6"
        >
          Blur · 所有不精确都值得被看见
        </p>
      </motion.div>
    </div>
  );
}
