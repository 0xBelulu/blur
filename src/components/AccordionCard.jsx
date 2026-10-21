import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * 目录页里那条可展开的条目。
 *
 * 原型 / 特质 / 题库三处原来是同一段 markup 抄了三遍，抄的时候还各加了一点私货
 * （只有题库给箭头加了 flex-shrink-0 ml-2，只有原型页没有）。这里收成一份。
 */
export default function AccordionCard({ isOpen, onToggle, summary, children, bodyClassName = "", cardRef }) {
  return (
    <div ref={cardRef} className="rounded-lg border border-blur-border/20 bg-blur-surface/10 overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blur-surface-hover/20 transition-colors cursor-pointer"
      >
        {summary}
        <ChevronDown
          size={14}
          className={`text-blur-text-muted transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 ${bodyClassName}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
