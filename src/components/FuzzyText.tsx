"use client";

import { useRef, useEffect } from "react";

export type FuzzyTextProps = {
  children: string;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: "horizontal" | "vertical" | "both";
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  glitchColor?: string;
  letterSpacing?: number;
  className?: string;
};

export default function FuzzyText({
  children,
  fontSize = "1.3rem",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#A11D1D",
  enableHover = true,
  baseIntensity = 0.15,
  hoverIntensity = 0.65,
  fuzzRange = 18,
  fps = 60,
  direction = "both",
  transitionDuration = 6,
  clickEffect = true,
  glitchMode = true,
  glitchInterval = 2600,
  glitchDuration = 140,
  glitchColor,
  letterSpacing = 1,
  className = "",
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resolve CSS values (vars, clamp, etc.) by setting them on the canvas element
    // then reading computed style — the canvas is in the DOM inside the shop container
    // which has all --theme-* and --font-* vars in scope.
    canvas.style.fontSize   = fontSize;
    canvas.style.fontFamily = fontFamily;
    canvas.style.fontWeight = String(fontWeight);
    canvas.style.color      = color;
    const cs             = getComputedStyle(canvas);
    const resolvedPx     = parseFloat(cs.fontSize) || 20;
    const resolvedFamily = cs.fontFamily || "sans-serif";
    const resolvedWeight = cs.fontWeight || "900";
    const resolvedColor  = cs.color || "#A11D1D";

    const fontStr = `${resolvedWeight} ${resolvedPx}px ${resolvedFamily}`;
    const pad     = Math.abs(fuzzRange) + 4;

    // Measure text width
    const probe = document.createElement("canvas").getContext("2d")!;
    probe.font = fontStr;
    (probe as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpacing}px`;
    const metrics  = probe.measureText(children);
    const textW    = Math.max(metrics.width + pad * 2, 1);
    const textH    = Math.max(resolvedPx * 1.55 + pad, 1);
    const baseline = resolvedPx * 1.1 + pad * 0.5;

    canvas.width  = Math.ceil(textW);
    canvas.height = Math.ceil(textH);

    // Resolve glitch color using same computed-style trick
    let resolvedGlitchColor: string | undefined;
    if (glitchMode && glitchColor) {
      canvas.style.outline = `1px solid ${glitchColor}`; // use outline (non-visual) to resolve var
      resolvedGlitchColor = getComputedStyle(canvas).outlineColor;
      canvas.style.outline = "";
    }

    // Draw source text to offscreen canvas
    const offscreen    = document.createElement("canvas");
    offscreen.width    = canvas.width;
    offscreen.height   = canvas.height;
    const off          = offscreen.getContext("2d")!;
    off.font           = fontStr;
    (off as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpacing}px`;
    off.fillStyle      = resolvedColor;
    off.fillText(children, pad, baseline);

    // Pre-render glitch overlay (shifted ghost pass in accent color)
    let glitchCanvas: HTMLCanvasElement | undefined;
    if (glitchMode && resolvedGlitchColor) {
      glitchCanvas          = document.createElement("canvas");
      glitchCanvas.width    = canvas.width;
      glitchCanvas.height   = canvas.height;
      const gc              = glitchCanvas.getContext("2d")!;
      gc.font               = fontStr;
      (gc as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpacing}px`;
      gc.fillStyle          = resolvedGlitchColor;
      gc.fillText(children, pad, baseline);
    }

    const ctx            = canvas.getContext("2d")!;
    const frameDelta     = 1000 / fps;
    let currentIntensity = baseIntensity;
    let targetIntensity  = baseIntensity;
    let isHovering       = false;
    let isGlitching      = false;
    let lastFrameTime    = 0;
    let rafId: number;

    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw);
      if (now - lastFrameTime < frameDelta) return;
      lastFrameTime = now;

      // Smooth intensity toward target
      const step = 1 / Math.max(1, transitionDuration);
      currentIntensity += (targetIntensity - currentIntensity) * step;

      const intensity = isGlitching ? 1.0 : currentIntensity;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Row-by-row fuzz: each scanline is independently offset
      for (let y = 0; y < canvas.height; y++) {
        const shiftX = direction !== "vertical"
          ? (Math.random() - 0.5) * 2 * fuzzRange * intensity
          : 0;
        const shiftY = direction === "both"
          ? (Math.random() - 0.5) * fuzzRange * 0.2 * intensity
          : 0;
        ctx.drawImage(offscreen, 0, y, canvas.width, 1, shiftX, y + shiftY, canvas.width, 1);
      }

      // During glitch: overlay ghost pass in accent color with slight offset
      if (isGlitching && glitchCanvas) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.55;
        const gx = (Math.random() - 0.5) * 10;
        const gy = (Math.random() - 0.5) * 4;
        ctx.drawImage(glitchCanvas, gx, gy);
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(draw);

    const onEnter = () => { if (enableHover) { isHovering = true; targetIntensity = hoverIntensity; } };
    const onLeave = () => { isHovering = false; targetIntensity = baseIntensity; };
    const onClick = () => {
      if (!clickEffect) return;
      currentIntensity = 1.0;
      targetIntensity  = isHovering ? hoverIntensity : baseIntensity;
    };

    let glitchTimer: ReturnType<typeof setInterval> | undefined;
    if (glitchMode) {
      glitchTimer = setInterval(() => {
        isGlitching = true;
        setTimeout(() => { isGlitching = false; }, glitchDuration);
      }, glitchInterval);
    }

    canvas.addEventListener("mouseenter",  onEnter);
    canvas.addEventListener("mouseleave",  onLeave);
    canvas.addEventListener("click",       onClick);
    canvas.addEventListener("touchstart",  onClick, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (glitchTimer) clearInterval(glitchTimer);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("touchstart", onClick);
    };
  }, [
    children, fontSize, fontWeight, fontFamily, color, enableHover,
    baseIntensity, hoverIntensity, fuzzRange, fps, direction,
    transitionDuration, clickEffect, glitchMode, glitchInterval,
    glitchDuration, glitchColor, letterSpacing,
  ]);

  return (
    <span
      className={className}
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
    >
      {/* Visually hidden for screen readers — canvas content is inaccessible */}
      <span
        aria-label={children}
        style={{
          position: "absolute", width: "1px", height: "1px",
          padding: 0, margin: "-1px", overflow: "hidden",
          clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
        }}
      >
        {children}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: "block", maxWidth: "100%" }}
      />
    </span>
  );
}
