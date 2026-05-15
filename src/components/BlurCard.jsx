import { useState } from "react";
import { motion } from "framer-motion";

export default function BlurCard({ option, index, isSelected, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const isActive = isSelected || isHovered;

  const handleClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onClick();
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        setIsHovered(false);
      }}
      onClick={handleClick}
      className={`
        relative p-5 rounded-2xl cursor-pointer transition-all duration-300
        ${isSelected ? "glass-strong prism-shift" : "glass"}
        ${!isSelected && isHovered ? "bg-blur-surface-hover" : ""}
      `}
      style={{
        opacity: isActive ? 1 : 0.78,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-sm leading-relaxed text-blur-text">
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
