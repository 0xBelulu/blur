import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function DraggableTabs({
  tabs,
  activeIndex,
  onChange,
  className = "",
  tabClassName = "",
  renderLabel,
}) {
  const containerRef = useRef(null);
  const [tabRects, setTabRects] = useState([]);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(null);
  const currentOffset = useRef(0);
  const isDragging = useRef(false);
  const wasDragging = useRef(false);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const buttons = containerRef.current.querySelectorAll("[data-tab]");
      const rects = Array.from(buttons).map((btn) => ({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      }));
      setTabRects(rects);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [tabs.length]);

  const activeRect = tabRects[activeIndex];
  const dragging = dragOffset !== 0;

  const handlePointerDown = (e) => {
    wasDragging.current = false;
    dragStartX.current = e.clientX;
    currentOffset.current = 0;
    isDragging.current = false;
  };

  const handlePointerMove = (e) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 3) {
      isDragging.current = true;
      currentOffset.current = dx;
      setDragOffset(dx);
    }
  };

  const handlePointerUp = () => {
    if (isDragging.current && tabRects.length) {
      wasDragging.current = true;
      const rect = tabRects[activeIndex];
      const currentCenter =
        (rect?.left || 0) + (rect?.width || 0) / 2 + currentOffset.current;

      let nearestIndex = activeIndex;
      let nearestDist = Infinity;
      tabRects.forEach((r, i) => {
        const tabCenter = r.left + r.width / 2;
        const dist = Math.abs(currentCenter - tabCenter);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      });

      if (nearestIndex !== activeIndex) {
        onChange(nearestIndex);
      }
    }

    setDragOffset(0);
    dragStartX.current = null;
    isDragging.current = false;
  };

  const handleClick = (i) => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    onChange(i);
  };

  const defaultRenderLabel = (isActive, label) => (
    <span
      className={`relative z-10 transition-colors duration-300 ${
        isActive
          ? "text-blur-text font-medium"
          : "text-blur-text-muted hover:text-blur-text"
      }`}
    >
      {label}
    </span>
  );

  const labelRenderer = renderLabel || defaultRenderLabel;

  return (
    <div
      ref={containerRef}
      className={`relative flex rounded-2xl glass p-1 select-none ${className}`}
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          data-tab
          onClick={() => handleClick(i)}
          className={`flex-1 relative z-10 cursor-pointer ${tabClassName}`}
        >
          {labelRenderer(activeIndex === i, tab.label)}
        </button>
      ))}

      {activeRect && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-xl bg-blur-surface shadow-sm pointer-events-none"
          animate={{
            left: activeRect.left + dragOffset,
            width: activeRect.width,
            scale: dragging ? 1.04 : 1,
          }}
          transition={
            dragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 380, damping: 30 }
          }
        />
      )}
    </div>
  );
}
