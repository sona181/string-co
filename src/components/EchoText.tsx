"use client";

import { useEffect, useState } from "react";
import "./EchoText.css";

type EchoDirection = "left" | "right" | "up" | "down";
type EchoMode = "entrance" | "hover" | "both";

export type EchoTextProps = {
  text: string;
  echoes?: number;
  lag?: number;
  offset?: number;
  direction?: EchoDirection;
  fade?: number;
  blur?: number;
  tint?: string;
  mode?: EchoMode;
  duration?: number;
  ease?: string;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  className?: string;
};

function dirOffset(dir: EchoDirection, px: number) {
  switch (dir) {
    case "right": return { x:  px, y: 0 };
    case "left":  return { x: -px, y: 0 };
    case "down":  return { x: 0, y:  px };
    case "up":    return { x: 0, y: -px };
  }
}

export default function EchoText({
  text,
  echoes = 6,
  lag = 0.3,
  offset = 14,
  direction = "right",
  fade = 0.55,
  blur = 2,
  tint,
  mode = "entrance",
  duration = 1400,
  ease = "ease-in-out",
  fontSize = "inherit",
  fontWeight = 400,
  fontFamily,
  color,
  className = "",
}: EchoTextProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Double rAF: first frame paints initial "off" state, second triggers transitions
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const { x: dx, y: dy } = dirOffset(direction, offset);
  // All copies start from the same "from" position (direction × (echoes+1) steps)
  const fromX = dx * (echoes + 1);
  const fromY = dy * (echoes + 1);

  return (
    <span
      className={`echo-text ${className}`}
      style={{ fontSize, fontWeight, fontFamily, color, position: "relative", display: "inline-block" }}
    >
      {/* Echo copies rendered behind main text */}
      {Array.from({ length: echoes }, (_, i) => {
        const step = i + 1; // step 1 = closest to main, step echoes = farthest
        const restX = dx * step;
        const restY = dy * step;
        const opacity = Math.pow(fade, step);
        const blurPx = (blur * step) / echoes;
        // Main text arrives first (delay 0), closest echo next, farthest last
        const delayS = `${(lag * step).toFixed(2)}s`;

        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              whiteSpace: "nowrap",
              color: tint,
              opacity: entered ? opacity : 0,
              filter: blurPx > 0.01 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
              transform: entered
                ? `translate(${restX}px,${restY}px)`
                : `translate(${fromX}px,${fromY}px)`,
              transition: entered
                ? [
                    `transform ${duration}ms ${ease} ${delayS}`,
                    `opacity ${Math.round(duration * 0.6)}ms ${ease} ${delayS}`,
                  ].join(",")
                : "none",
              pointerEvents: "none",
            }}
          >
            {text}
          </span>
        );
      })}

      {/* Main text — arrives first, no delay */}
      <span
        style={{
          display: "inline-block",
          position: "relative",
          transform: entered ? "translate(0,0)" : `translate(${fromX}px,${fromY}px)`,
          transition: entered ? `transform ${duration}ms ${ease} 0s` : "none",
        }}
      >
        {text}
      </span>
    </span>
  );
}
