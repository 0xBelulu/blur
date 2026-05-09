import { motion } from "framer-motion";

export default function GlassButton({ children, onClick, variant = "primary", className = "", disabled = false }) {
  const baseClasses = "relative px-6 py-3 rounded-2xl font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blur-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-blur-bg";

  const variants = {
    primary: "glass-strong text-blur-text hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
    secondary: "glass text-blur-text hover:bg-blur-surface-hover hover:shadow-md active:scale-[0.98]",
    ghost: "bg-transparent text-blur-text-muted hover:text-blur-text hover:bg-blur-surface/50",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      whileTap={disabled ? {} : { scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}
