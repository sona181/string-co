"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface AnimatedListProps {
  items: string[];
  selectedIndex?: number;
  onItemSelect?: (item: string, index: number) => void;
  onSelectedIndexChange?: (index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  className?: string;
}

export default function AnimatedList({
  items,
  selectedIndex = -1,
  onItemSelect,
  onSelectedIndexChange,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = false,
  className = "",
}: Readonly<AnimatedListProps>) {
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Internal arrow nav — fires onSelectedIndexChange so parent can sync
  useEffect(() => {
    if (!enableArrowNavigation || !onSelectedIndexChange) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onSelectedIndexChange(Math.min(selectedIndex + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onSelectedIndexChange(Math.max(selectedIndex - 1, -1));
      }
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  }, [enableArrowNavigation, selectedIndex, items.length, onSelectedIndexChange]);

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      {showGradients && items.length > 4 && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 28,
          background: "linear-gradient(to bottom, var(--al-bg, rgba(0,0,0,0.9)), transparent)",
          pointerEvents: "none", zIndex: 2,
        }} />
      )}

      <ul
        ref={listRef}
        style={{
          listStyle: "none",
          margin: 0,
          padding: "6px 0",
          maxHeight: 280,
          overflowY: "auto",
          scrollbarWidth: displayScrollbar ? "thin" : "none",
          scrollbarColor: displayScrollbar ? "var(--theme-accent, #FF3B1F) transparent" : undefined,
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, i) => {
            const isSelected = i === selectedIndex;
            return (
              <motion.li
                key={item}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: 1,
                  x: isSelected ? 6 : 0,
                  color: isSelected
                    ? "var(--al-selected, var(--theme-accent, #FF3B1F))"
                    : "var(--al-text, var(--theme-text, #F2EFE4))",
                }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={() => onItemSelect?.(item, i)}
                onMouseEnter={() => onSelectedIndexChange?.(i)}
                onMouseLeave={() => onSelectedIndexChange?.(-1)}
                style={{
                  padding: "9px 14px 9px 13px",
                  cursor: "pointer",
                  borderRadius: 10,
                  margin: "2px 6px",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {item}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {showGradients && items.length > 4 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 28,
          background: "linear-gradient(to top, var(--al-bg, rgba(0,0,0,0.9)), transparent)",
          pointerEvents: "none", zIndex: 2,
        }} />
      )}
    </div>
  );
}
