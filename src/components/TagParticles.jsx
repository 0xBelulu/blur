import { motion } from "framer-motion";

export default function TagParticles({ tags, positions, focus = 0.5 }) {
  return (
    <div className="relative w-full h-full">
      {tags.map((tag, i) => {
        const pos = positions[i] || { x: 0, y: 0, blur: 0 };

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
            }}
          >
            <motion.span
              className="px-3 py-1.5 rounded-full text-xs font-medium text-blur-text glass inline-block"
              animate={{
                x: [0, 2 * (i % 2 === 0 ? 1 : -1), -1.5, 0],
                y: [0, -2, 1.5 * (i % 2 === 0 ? 1 : -1), 0],
              }}
              transition={{
                duration: 6 + i * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            >
              {tag}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
