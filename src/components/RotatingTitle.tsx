"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import WarpText from "@/components/WarpText";

const FONTS: string[] = [
  "--font-lunatic",
  "--font-riemish",
  "--font-first-lyrics",
  "--font-second-lyrics",
  "--font-wild-sewerage",
  "--font-zombiewolf",
];

const INTERVAL_MS = 3000;

type Props = {
  text: string;
  color?: string;
  className?: string;
  fontSize?: string;
  canvasHeight?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

export default function RotatingTitle({ text, color = "#ffffff", className, fontSize = "clamp(5rem, 14vw, 20rem)", canvasHeight = "clamp(12rem, 29vw, 31rem)", strokeColor, strokeWidth }: Readonly<Props>) {
  const [index, setIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const el = wrapperRef.current;
      if (!el) return;

      gsap.timeline()
        // glitch out — horizontal jitter, no layout shift
        .to(el, { x: -14, opacity: 1,   duration: 0.045, ease: "none" })
        .to(el, { x:  10, opacity: 0.6, duration: 0.04,  ease: "none" })
        .to(el, { x: -18, opacity: 0.3, duration: 0.035, ease: "none" })
        .to(el, { x:   8, opacity: 0.7, duration: 0.03,  ease: "none" })
        .to(el, { x: -10, opacity: 0.1, duration: 0.04,  ease: "none" })
        .to(el, { x:   0, opacity: 0,   duration: 0.02,  ease: "none" })
        // swap font at invisible frame
        .call(() => setIndex((i) => (i + 1) % FONTS.length))
        // snap in with one sharp jitter then settle
        .fromTo(el,
          { x: 16,  opacity: 0 },
          { x:  0,  opacity: 1, duration: 0.3, ease: "power4.out" }
        );
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ transformOrigin: "left center" }}
    >
      <WarpText
        text={text}
        color={color}
        fontFamily={`var(${FONTS[index]})`}
        fontSize={fontSize}
        fontWeight={800}
        letterSpacing="-0.02em"
        warpStrength={0.32}
        warpScale={2.6}
        speed={1.3}
        pointerInfluence={0.6}
        pointerStrength={0.9}
        refraction={0.06}
        ripple
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        style={{ height: canvasHeight, minHeight: 0 }}
      />
    </div>
  );
}
