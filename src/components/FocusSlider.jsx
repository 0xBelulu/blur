import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function FocusSlider({ value, onChange, min = 0, max = 100 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const normalizedValue = localValue / max;
  const blurAmount = 8 - normalizedValue * 6;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <span className="text-xs text-blur-text-muted tracking-wider">
          拖动调焦
        </span>
        <motion.span
          className="text-xs text-blur-accent font-medium"
          animate={{ opacity: isDragging ? 1 : 0.6 }}
        >
          {Math.round(normalizedValue * 100)}%
        </motion.span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="blur-slider"
        />
        
        {/* Focus indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${normalizedValue * 100}%`, marginLeft: "-12px" }}
          animate={{ scale: isDragging ? 1.3 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
            style={{ 
              background: `linear-gradient(135deg, #9b8ec7 0%, #8fb5c4 100%)`,
            }}
          />
        </motion.div>
      </div>

      {/* Visual blur indicator */}
      <div className="flex justify-center mt-4">
        <motion.div
          className="text-sm text-blur-text-muted"
          animate={{ filter: `blur(${blurAmount}px)` }}
          transition={{ duration: 0.3 }}
        >
          {normalizedValue < 0.2 && "太模糊了…"}
          {normalizedValue >= 0.2 && normalizedValue < 0.5 && "隐约能看清"}
          {normalizedValue >= 0.5 && normalizedValue < 0.8 && "差不多了"}
          {normalizedValue >= 0.8 && "可以了，再清就不像了"}
        </motion.div>
      </div>
    </div>
  );
}
