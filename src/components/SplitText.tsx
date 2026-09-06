"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./SplitText.css";

type AnimVars = Record<string, number | string>;

export type SplitTextProps = {
  text: string;
  tag?: keyof React.JSX.IntrinsicElements;
  className?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  delay?: number;       // ms stagger between chars
  duration?: number;    // seconds per char
  ease?: string;
  splitType?: "chars" | "words" | "lines";
  from?: AnimVars;
  to?: AnimVars;
  threshold?: number;   // IntersectionObserver threshold
  rootMargin?: string;  // IntersectionObserver rootMargin
  textAlign?: string;
};

export default function SplitText({
  text,
  tag = "p",
  className = "",
  textColor,
  fontSize = "clamp(1rem,2vw,1.4rem)",
  fontFamily,
  delay = 70,
  duration = 0.9,
  ease = "power1.out",
  splitType = "chars",
  from = { opacity: 0, y: 18 },
  to   = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-50px",
  textAlign = "left",
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const charRefs     = useRef<(HTMLSpanElement | null)[]>([]);

  // Split text into spans based on splitType
  const units =
    splitType === "words" ? text.split(/(\s+)/) :  // preserve whitespace tokens
    splitType === "lines" ? [text] :
    text.split("");                                  // chars

  useGSAP(() => {
    const els = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (els.length === 0) return;

    const tl = gsap.timeline({ paused: true });
    tl.fromTo(els, from, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tl.play();
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => { observer.disconnect(); tl.kill(); };
  }, {
    scope: containerRef,
    dependencies: [text, delay, duration, ease, threshold, rootMargin, splitType],
  });

  const Tag = tag as React.ElementType;
  let refIndex = 0;

  const buildSpans = () => {
    if (splitType === "chars") {
      return text.split("").map((ch, i) => {
        const isSpace = ch === " ";
        const idx = refIndex++;
        return (
          <span
            key={i}
            ref={el => { charRefs.current[idx] = el; }}
            className="split-text__unit"
          >
            {isSpace ? " " : ch}
          </span>
        );
      });
    }

    if (splitType === "words") {
      return units.map((unit, i) => {
        const isWhitespace = /^\s+$/.test(unit);
        if (isWhitespace) return <span key={i} style={{ display: "inline-block" }}>{unit}</span>;
        const idx = refIndex++;
        return (
          <span
            key={i}
            ref={el => { charRefs.current[idx] = el; }}
            className="split-text__unit"
          >
            {unit}
          </span>
        );
      });
    }

    // lines
    const idx = refIndex++;
    return (
      <span
        ref={el => { charRefs.current[idx] = el; }}
        className="split-text__unit"
      >
        {text}
      </span>
    );
  };

  return (
    <Tag
      ref={containerRef}
      className={`split-text ${className}`}
      style={{
        color:      textColor,
        fontSize,
        fontFamily,
        textAlign,
        display:    "block",
        lineHeight: 1.25,
        margin:     0,
      }}
    >
      {/* Screen-reader text */}
      <span className="split-text__sr">{text}</span>
      {/* Animated chars */}
      <span aria-hidden="true" style={{ display: "inline" }}>
        {buildSpans()}
      </span>
    </Tag>
  );
}
