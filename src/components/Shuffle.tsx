"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type ShuffleProps = {
  text: string;
  shuffleDirection?: "left" | "right" | "center";
  duration?: number;
  animationMode?: "all" | "evenodd";
  shuffleTimes?: number;
  ease?: string;
  stagger?: number;
  threshold?: number;
  triggerOnce?: boolean;
  triggerOnHover?: boolean;
  respectReducedMotion?: boolean;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export default function Shuffle({
  text,
  shuffleDirection = "right",
  duration = 0.35,
  animationMode = "evenodd",
  shuffleTimes = 1,
  ease = "power3.out",
  stagger = 0.03,
  threshold = 0.1,
  triggerOnce = true,
  triggerOnHover = true,
  respectReducedMotion = true,
  colorFrom = "#00C2A8",
  colorTo = "#F2EFE4",
  className,
}: ShuffleProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef        = useRef<gsap.core.Timeline | null>(null);

  const prefersReduced =
    respectReducedMotion &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Build letter spans from text
  const letters = text.split("").map((char, i) => ({ char, i }));

  const animate = useCallback(() => {
    if (prefersReduced) return;
    if (!containerRef.current) return;

    const spans = containerRef.current.querySelectorAll<HTMLSpanElement>("[data-char]");
    if (!spans.length) return;

    tlRef.current?.kill();

    const indices = Array.from(spans).map((_, i) => i);
    if (shuffleDirection === "right") indices.reverse();
    else if (shuffleDirection === "center") {
      const mid = Math.floor(indices.length / 2);
      const left  = indices.slice(0, mid).reverse();
      const right = indices.slice(mid);
      indices.splice(0, indices.length, ...left.flatMap((l, i) => [l, right[i]]).filter(Boolean));
    }

    const tl = gsap.timeline();
    tlRef.current = tl;

    spans.forEach((span, rawIdx) => {
      const orderIdx = indices.indexOf(rawIdx);
      const delay    = orderIdx * stagger;

      // Only animate letters that match the animationMode filter
      if (animationMode === "evenodd" && rawIdx % 2 !== 0 && shuffleTimes > 0) {
        // still stagger but skip heavy shuffle for odd indices on evenodd mode
      }

      let iteration = 0;
      const originalChar = span.dataset.char ?? span.textContent ?? "";

      tl.to(span, {
        duration,
        ease,
        delay,
        color: colorTo,
        onStart() {
          const scramble = setInterval(() => {
            if (iteration >= shuffleTimes * 3) {
              clearInterval(scramble);
              span.textContent = originalChar === " " ? " " : originalChar;
            } else {
              span.textContent = originalChar === " " ? " " : randomChar();
              iteration++;
            }
          }, (duration * 1000) / (shuffleTimes * 3 + 1));
        },
      }, 0);

      tl.fromTo(
        span,
        { color: colorFrom },
        { color: colorTo, duration, ease, delay },
        0
      );
    });
  }, [prefersReduced, shuffleDirection, stagger, animationMode, shuffleTimes, duration, ease, colorFrom, colorTo]);

  // Intersection Observer — trigger on enter
  useEffect(() => {
    if (prefersReduced) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!triggerOnce || !hasPlayedRef.current) {
            hasPlayedRef.current = true;
            animate();
          }
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, threshold, triggerOnce, prefersReduced]);

  // Hover replay
  const handleMouseEnter = useCallback(() => {
    if (!triggerOnHover || prefersReduced) return;
    animate();
  }, [triggerOnHover, prefersReduced, animate]);

  // Set initial color on mount
  useGSAP(() => {
    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll<HTMLSpanElement>("[data-char]");
    gsap.set(spans, { color: colorFrom });
  }, { scope: containerRef });

  return (
    <span
      ref={containerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      aria-label={text}
      style={{ display: "inline", whiteSpace: "normal" }}
    >
      {letters.map(({ char, i }) => (
        <span
          key={i}
          data-char={char}
          style={{
            display: "inline",
            color: colorFrom,
            willChange: "color",
          }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
