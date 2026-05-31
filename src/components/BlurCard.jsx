import { motion } from "framer-motion";

export default function BlurCard({ option, isSelected, onClick }) {
  const handleClick = () => {
    try {
      navigator?.vibrate?.(10);
    } catch { /* vibrate not supported */ }
    onClick();
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      onClick={handleClick}
      className={`
        relative p-5 rounded-2xl cursor-pointer transition-all duration-300
        ${isSelected ? "glass-strong prism-shift" : "glass hover:bg-blur-surface-hover"}
        group
      `}
      style={{
        opacity: isSelected ? 1 : undefined,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="text-sm leading-relaxed text-blur-text transition-opacity duration-300"
        style={{ opacity: isSelected ? 1 : 0.78 }}
      >
        {option.text}
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blur-accent flex items-center justify-center"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 5L3.5 7.5L9 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
