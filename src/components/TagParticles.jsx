import { motion } from "framer-motion";

export default function TagParticles({ tags, positions }) {
  return (
    <div className="relative w-full h-full">
      {tags.map((tag, i) => {
        const pos = positions[i] || { x: 0, y: 0, blur: 2 };
        return (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.6 }}
            className="absolute whitespace-nowrap"
            style={{
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: "translate(-50%, -50%)",
              filter: `blur(${pos.blur}px)`,
            }}
          >
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-blur-text glass">
              {tag}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
