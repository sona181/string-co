"use client";

import { useEffect, useRef } from "react";
import "./SplitFlapText.css";

const CHARSETS = {
  alpha:         "ABCDEFGHIJKLMNOPQRSTUVWXYZ ",
  alphanumeric:  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
  numeric:       "0123456789 ",
} as const;

function randomChar(set: string) {
  return set[Math.floor(Math.random() * set.length)];
}

export type SplitFlapTextProps = {
  text: string;
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: keyof typeof CHARSETS;
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number;
  gap?: number;
  fontSize?: number;
  loop?: boolean;
  padTo?: number;
};

export default function SplitFlapText({
  text,
  flipDuration = 0.16,
  stagger = 0.05,
  cycleDelay = 3200,
  charset = "alpha",
  flipsPerChar = 5,
  tileColor = "#1B2A4A",
  textColor = "#D98E2B",
  tileRadius = 4,
  gap = 4,
  fontSize = 22,
  loop = false,
  padTo = 0,
}: SplitFlapTextProps) {
  const chars  = CHARSETS[charset];
  const target = padTo > 0
    ? text.toUpperCase().padEnd(padTo, " ")
    : text.toUpperCase();

  const tileRefs    = useRef<(HTMLSpanElement | null)[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const flipMs = flipDuration * 1000;
    const len    = target.length;

    const runAnimation = () => {
      for (let i = 0; i < len; i++) {
        const charDelay = stagger * i * 1000;

        for (let f = 0; f < flipsPerChar; f++) {
          const flipStart = charDelay + f * flipMs;
          const isLast    = f === flipsPerChar - 1;
          const nextChar  = isLast ? target[i] : randomChar(chars);

          // Start the CSS flip animation
          const t1 = setTimeout(() => {
            const el = tileRefs.current[i];
            if (!el) return;
            el.classList.remove("split-flap-tile--flip");
            void el.offsetWidth; // reset animation
            el.classList.add("split-flap-tile--flip");
          }, flipStart);

          // Change character at the midpoint (tile is face-on from behind)
          const t2 = setTimeout(() => {
            const el = tileRefs.current[i];
            if (!el) return;
            el.textContent = nextChar === " " ? " " : nextChar;
          }, flipStart + flipMs * 0.5);

          timeoutsRef.current.push(t1, t2);
        }
      }

      if (loop) {
        const totalMs = stagger * (len - 1) * 1000 + flipsPerChar * flipMs;
        const t = setTimeout(runAnimation, totalMs + cycleDelay);
        timeoutsRef.current.push(t);
      }
    };

    runAnimation();
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, [target, chars, flipDuration, stagger, flipsPerChar, loop, cycleDelay]);

  const tileW = Math.round(fontSize * 0.7);
  const tileH = Math.round(fontSize * 1.4);

  return (
    <span style={{ display: "inline-flex", gap: `${gap}px`, flexWrap: "wrap" }}>
      {Array.from({ length: target.length }, (_, i) => (
        <span
          key={i}
          ref={el => { tileRefs.current[i] = el; }}
          className="split-flap-tile"
          style={{
            background:   tileColor,
            color:        textColor,
            borderRadius: `${tileRadius}px`,
            fontSize:     `${fontSize}px`,
            width:        `${tileW}px`,
            height:       `${tileH}px`,
            "--flip-duration": `${flipDuration}s`,
          } as React.CSSProperties}
        >
          {" "}
        </span>
      ))}
    </span>
  );
}
