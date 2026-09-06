"use client";

// Inspired by Tom Miller / GSAP community — custom implementation using free gsap core only
// (SplitText + ScrambleTextPlugin are club-only; behavior is reproduced manually)

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export type ScrambledTextProps = {
  radius?: number;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function ScrambledText({
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = ".:",
  className = "",
  style = {},
  children,
}: ScrambledTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const p = root.querySelector("p");
    if (!p) return;

    // Split into per-character spans
    const text = p.textContent ?? "";
    p.innerHTML = "";
    const spans: HTMLSpanElement[] = [];

    for (const char of text) {
      const span = document.createElement("span");
      span.className = "scramble-char";
      span.dataset.content = char;
      span.textContent = char;
      p.appendChild(span);
      spans.push(span);
    }

    const handleMove = (e: PointerEvent) => {
      spans.forEach((c) => {
        const original = c.dataset.content ?? "";
        if (original === " " || original === "\n") return;

        const rect = c.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const scramDuration = duration * (1 - dist / radius);
          const steps = Math.max(3, Math.ceil((scramDuration / speed) * 12));
          let step = 0;

          gsap.killTweensOf(c);
          gsap.to(c, {
            duration: scramDuration,
            ease: "none",
            overwrite: true,
            onUpdate() {
              step++;
              if (step < steps) {
                const idx = Math.floor(Math.random() * scrambleChars.length);
                c.textContent = scrambleChars[idx] ?? original;
              } else {
                c.textContent = original;
              }
            },
            onComplete() {
              c.textContent = original;
            },
          });
        }
      });
    };

    root.addEventListener("pointermove", handleMove);

    return () => {
      root.removeEventListener("pointermove", handleMove);
      spans.forEach((s) => {
        gsap.killTweensOf(s);
        s.textContent = s.dataset.content ?? "";
      });
    };
  }, [radius, duration, speed, scrambleChars]);

  return (
    <div ref={rootRef} className={`scramble-block ${className}`} style={style}>
      <p>{children}</p>
    </div>
  );
}
