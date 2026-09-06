"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  interval?: number;
};

export default function GlitchLoop({ children, delay = 0, className = "", interval = 2.8 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let loopId: ReturnType<typeof setTimeout>;

    const runGlitch = () => {
      gsap.timeline()
        .to(el, { x: -9,  duration: 0.04,  ease: "none" })
        .to(el, { x:  11, duration: 0.035, ease: "none" })
        .to(el, { x: -6,  duration: 0.03,  ease: "none" })
        .to(el, { x:  4,  duration: 0.025, ease: "none" })
        .to(el, { x:  0,  duration: 0.18,  ease: "power3.out" });

      loopId = setTimeout(runGlitch, interval * 1000);
    };

    // Entry animation: slide up + glitch in, then start looping
    const entryTl = gsap.timeline({ delay, paused: true })
      .fromTo(el, { y: 44, opacity: 0 }, { y: 0, opacity: 0.8, duration: 0.28, ease: "power2.out" })
      .to(el, { x: -8,  duration: 0.04,  ease: "none" })
      .to(el, { x:  10, duration: 0.035, ease: "none" })
      .to(el, { x: -5,  duration: 0.03,  ease: "none" })
      .to(el, { x:  3,  duration: 0.025, ease: "none" })
      .to(el, { x:  0, opacity: 1, duration: 0.22, ease: "power3.out" })
      .call(() => { loopId = setTimeout(runGlitch, interval * 1000); });

    ScrollTrigger.create({
      trigger: el,
      start: "top bottom-=60px",
      onEnter: () => entryTl.restart(),
      onLeaveBack: () => {
        entryTl.pause(0);
        clearTimeout(loopId);
        gsap.set(el, { y: 44, opacity: 0, x: 0 });
      },
    });

    // If already in view on mount, play immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) entryTl.play();

    return () => {
      clearTimeout(loopId);
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [delay, interval]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
