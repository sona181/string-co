"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  fromX?: number;
  className?: string;
};

export default function GlitchReveal({ children, delay = 0, duration = 0.28, fromX = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tl = gsap.timeline({ paused: true, delay });

    tl.fromTo(el,
        { x: fromX, y: fromX ? 0 : 44, opacity: 0 },
        { x: 0,     y: 0,              opacity: 0.85, duration, ease: "power4.out" }
      )
      .to(el, { x: -10, duration: 0.04,  ease: "none" })
      .to(el, { x:  13, duration: 0.035, ease: "none" })
      .to(el, { x:  -6, duration: 0.03,  ease: "none" })
      .to(el, { x:   4, duration: 0.025, ease: "none" })
      .to(el, { x:   0, opacity: 1, duration: 0.22, ease: "power3.out" });

    ScrollTrigger.create({
      trigger: el,
      start: "top bottom-=60px",
      onEnter: () => tl.restart(),
      onLeaveBack: () => { tl.pause(0); gsap.set(el, { x: fromX, y: fromX ? 0 : 44, opacity: 0 }); },
    });

    // If already in view on mount, play immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) tl.play();

    return () => {
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [delay]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
