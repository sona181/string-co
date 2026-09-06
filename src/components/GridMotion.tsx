"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./GridMotion.css";

type Props = {
  items?: (string | React.ReactNode)[];
  gradientColor?: string;
};

const ROWS = 6;
const COLS = 10;
const TOTAL = ROWS * COLS;

export default function GridMotion({ items = [], gradientColor = "#0D0D0D" }: Props) {
  const gridRef  = useRef<HTMLDivElement>(null);
  const rowRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef(0);

  const defaultItems = Array.from({ length: TOTAL }, (_, i) => `Item ${i + 1}`);
  const combined = items.length > 0 ? items.slice(0, TOTAL) : defaultItems;

  useEffect(() => {
    mouseXRef.current = window.innerWidth / 2;
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = (e: MouseEvent) => { mouseXRef.current = e.clientX; };

    const updateMotion = () => {
      const maxMove = 300;
      const baseDuration = 0.8;
      const inertia = [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const dir = i % 2 === 0 ? 1 : -1;
        const move = ((mouseXRef.current / window.innerWidth) * maxMove - maxMove / 2) * dir;
        gsap.to(row, { x: move, duration: baseDuration + inertia[i % inertia.length], ease: "power3.out", overwrite: "auto" });
      });
    };

    const ticker = gsap.ticker.add(updateMotion);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <div className="noscroll" ref={gridRef}>
      <section className="intro" style={{ background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)` }}>
        <div className="gridMotion-container">
          {new Array(ROWS).fill(null).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="row"
              ref={el => { rowRefs.current[rowIndex] = el; }}
            >
              {new Array(COLS).fill(null).map((_, itemIndex) => {
                const content = combined[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor: "#111" }}>
                      {typeof content === "string" && content.startsWith("http") ? (
                        <div className="row__item-img" style={{ backgroundImage: `url(${content})` }} />
                      ) : (
                        <div className="row__item-content">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="dome-overlay" />
        <div className="dome-overlay-blur" />
        <div className="dome-edge dome-edge--top" />
        <div className="dome-edge dome-edge--bottom" />
        <div className="fullview" />
      </section>
    </div>
  );
}
