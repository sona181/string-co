"use client";

import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  rotationEnd?: string;
  wordAnimationEnd?: string;
};

export default function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  textStyle,
  rotationEnd = "center center",
  wordAnimationEnd = "center center",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isString = typeof children === "string";

  const splitText = useMemo(() => {
    const text = isString ? (children as string) : "";
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return <span className="word" key={index}>{word}</span>;
    });
  }, [children, isString]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef?.current ?? window;

    // Rotate the container as the user scrolls into it
    gsap.fromTo(
      el,
      { transformOrigin: "0% 50%", rotate: baseRotation },
      {
        ease: "none",
        rotate: 0,
        scrollTrigger: { trigger: el, scroller, start: "top bottom", end: rotationEnd, scrub: true },
      }
    );

    // Word-level (or container-level) opacity + blur
    const wordEls = el.querySelectorAll(".word");
    const targets = wordEls.length > 0 ? wordEls : [el];
    const stagger = wordEls.length > 0 ? 0.02 : 0;

    gsap.fromTo(
      targets,
      { opacity: baseOpacity, willChange: "opacity" },
      {
        ease: "none",
        opacity: 1,
        stagger,
        scrollTrigger: { trigger: el, scroller, start: "top bottom", end: wordAnimationEnd, scrub: 1.5 },
      }
    );

    if (enableBlur) {
      gsap.fromTo(
        targets,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: "none",
          filter: "blur(0px)",
          stagger,
          scrollTrigger: { trigger: el, scroller, start: "top bottom", end: wordAnimationEnd, scrub: 1.5 },
        }
      );
    }

    return () => {
      // Only kill triggers owned by this element
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`.trim()}>
      {isString ? (
        <p className={`scroll-reveal-text ${textClassName}`.trim()} style={textStyle}>
          {splitText}
        </p>
      ) : (
        children
      )}
    </div>
  );
}
