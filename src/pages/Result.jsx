import { useRef } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import CloudCanvas from "../components/CloudCanvas";
import TagParticles from "../components/TagParticles";
import ShareButton from "../components/ShareButton";
import GlassButton from "../components/GlassButton";

export default function Result({ result, onRestart }) {
  const captureRef = useRef(null);
  const { archetype, tags, cloudData } = result;

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-md mx-auto w-full">
      <div ref={captureRef} className="flex flex-col items-center">
        {/* Cloud Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative w-[320px] h-[320px] mb-8"
        >
          <div className="absolute inset-0 flex items-center justify-center"
          >
            <CloudCanvas
              cloudData={cloudData}
              width={320}
              height={320}
            />
          </div>
          
          {/* Tags floating around cloud */}
          <div className="absolute inset-0"
          >
            <TagParticles
              tags={tags.slice(0, 5)}
              positions={cloudData.tagPositions.slice(0, 5)}
            />
          </div>

          {/* Ambient glow */}
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-3xl -z-10"
            style={{
              background: "radial-gradient(circle at 40% 40%, rgba(155,142,199,0.4) 0%, rgba(143,181,196,0.2) 50%, transparent 70%)",
            }}
          />
        </motion.div>

        {/* Brand label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-6"
        >
          <span className="text-[11px] text-blur-text-light tracking-[0.25em] uppercase">
            Blur 人格云图
          </span>
        </motion.div>

        {/* Archetype Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-[28px] font-medium text-blur-text tracking-tight leading-tight mb-4"
          >
            {archetype.title}
          </h1>
          
          <p className="text-sm text-blur-text-muted leading-relaxed px-2"
          >
            {archetype.description}
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-16 h-px bg-gradient-to-r from-transparent via-blur-border to-transparent mx-auto mb-6"
        />

        {/* All Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.07 }}
                className="px-3.5 py-1.5 rounded-full text-xs text-blur-text glass"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-blur-text-light italic text-center"
        >
          "所有不精确都值得被看见"
        </motion.p>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="mt-auto pt-10 space-y-4"
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
      </motion.div>
    </div>
  );
}
