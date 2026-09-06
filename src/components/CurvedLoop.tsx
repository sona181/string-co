"use client";

import { useRef, useEffect, useId } from "react";
import "./CurvedLoop.css";

const REPEATS = 10;

export type CurvedLoopProps = {
  marqueeText: string;
  speed?: number;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  className?: string;
};

export default function CurvedLoop({
  marqueeText,
  speed = 2,
  curveAmount = 400,
  direction = "left",
  interactive = true,
  textColor = "#B5502C",
  fontFamily = "serif",
  fontSize = 14,
  letterSpacing = 0.12,
  className = "",
}: CurvedLoopProps) {
  const uid    = useId().replace(/:/g, "");
  const pathId = `cl-${uid}`;

  const svgRef      = useRef<SVGSVGElement>(null);
  const pathRef     = useRef<SVGPathElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const offsetRef   = useRef(0);
  const singleRef   = useRef(200); // px length of one marqueeText unit
  const rafRef      = useRef<number>();
  const dragging    = useRef(false);
  const lastX       = useRef(0);

  // Build repeated text — 10 copies ensures seamless fill at any path length
  const repeatedText = Array.from({ length: REPEATS }, () => marqueeText).join("   ");

  useEffect(() => {
    const svg      = svgRef.current;
    const pathEl   = pathRef.current;
    const textEl   = textPathRef.current;
    if (!svg || !pathEl || !textEl) return;

    const rebuildPath = () => {
      const w     = svg.clientWidth  || 300;
      const h     = svg.clientHeight || 70;
      const baseY = h * 0.82;
      const ctrlY = baseY - curveAmount * 0.28; // control point above baseline
      pathEl.setAttribute("d", `M 0,${baseY} Q ${w / 2},${ctrlY} ${w},${baseY}`);
    };

    const ro = new ResizeObserver(rebuildPath);
    ro.observe(svg);
    rebuildPath();

    const dirSign = direction === "right" ? -1 : 1;

    // Measure single-unit length after first render, then start loop
    const init = () => {
      const total = textEl.getComputedTextLength();
      if (total > 0) singleRef.current = total / REPEATS;

      const loop = () => {
        if (!dragging.current) {
          offsetRef.current += speed * dirSign * 0.5;
        }
        const len = singleRef.current;
        offsetRef.current = ((offsetRef.current % len) + len) % len;
        textEl.setAttribute("startOffset", `${offsetRef.current}px`);
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(init);

    const onDown = (e: PointerEvent) => {
      if (!interactive) return;
      dragging.current = true;
      lastX.current    = e.clientX;
      svg.setPointerCapture(e.pointerId);
      svg.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !interactive) return;
      const dx      = e.clientX - lastX.current;
      lastX.current = e.clientX;
      offsetRef.current -= dx * 0.5;
    };
    const onUp = () => {
      dragging.current = false;
      if (interactive) svg.style.cursor = "grab";
    };

    svg.addEventListener("pointerdown",  onDown);
    svg.addEventListener("pointermove",  onMove);
    svg.addEventListener("pointerup",    onUp);
    svg.addEventListener("pointercancel", onUp);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      svg.removeEventListener("pointerdown",  onDown);
      svg.removeEventListener("pointermove",  onMove);
      svg.removeEventListener("pointerup",    onUp);
      svg.removeEventListener("pointercancel", onUp);
    };
  }, [speed, curveAmount, direction, interactive, marqueeText]);

  return (
    <svg
      ref={svgRef}
      className={`curved-loop ${className}`}
      style={{
        width:    "100%",
        height:   "100%",
        overflow: "visible",
        cursor:   interactive ? "grab" : "default",
        display:  "block",
      }}
    >
      <defs>
        <path ref={pathRef} id={pathId} fill="none" />
      </defs>
      <text
        className="curved-loop__text"
        style={{
          fill:          textColor,
          fontFamily,
          fontSize:      `${fontSize}px`,
          fontWeight:    700,
          letterSpacing: `${letterSpacing}em`,
        }}
      >
        <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0px">
          {repeatedText}
        </textPath>
      </text>
    </svg>
  );
}
