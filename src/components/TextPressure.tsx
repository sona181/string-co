"use client";

import { useRef, useEffect } from "react";
import "./TextPressure.css";

export type TextPressureProps = {
  text: string;
  fontFamily?: string;
  fontUrl?: string;
  flex?: boolean;
  alpha?: boolean;
  stroke?: boolean;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  minFontSize?: number;
  className?: string;
};

export default function TextPressure({
  text,
  fontFamily = "Roboto Flex",
  fontUrl = "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap",
  flex = true,
  alpha = false,
  stroke = false,
  width = true,
  weight = true,
  italic = false,
  scale = false,
  textColor = "#00E5FF",
  strokeColor = "#FF2ED1",
  minFontSize = 22,
  className = "",
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs     = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseRef     = useRef({ x: -9999, y: -9999 });
  const rafRef       = useRef<number>();
  const chars        = text.split("");

  // Inject Google Font once per page session
  useEffect(() => {
    if (!fontUrl) return;
    const id = "text-pressure-font-link";
    if (document.getElementById(id)) return;
    const link       = document.createElement("link");
    link.id          = id;
    link.rel         = "stylesheet";
    link.href        = fontUrl;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, [fontUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const els = charRefs.current.filter(Boolean) as HTMLSpanElement[];

    const update = () => {
      const { x: mx, y: my } = mouseRef.current;
      els.forEach(el => {
        const r    = el.getBoundingClientRect();
        const cx   = r.left + r.width  / 2;
        const cy   = r.top  + r.height / 2;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        // 180px falloff: at cursor=1, at 180px away=0
        const prox = Math.max(0, 1 - dist / 180);

        const axes: string[] = [];
        if (weight) axes.push(`'wght' ${Math.round(200 + prox * 700)}`); // 200–900
        if (width)  axes.push(`'wdth' ${Math.round(50  + prox * 101)}`); // 50–151
        if (italic) axes.push(`'ital' ${prox.toFixed(2)}`);
        if (axes.length) el.style.fontVariationSettings = axes.join(", ");
        if (alpha) el.style.opacity = (0.55 + prox * 0.45).toFixed(3);
        if (scale) el.style.transform = `scale(${(1 + prox * 0.12).toFixed(3)})`;
      });
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    const onMove  = (e: PointerEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener("pointermove",    onMove,  { passive: true });
    container.addEventListener("pointerleave", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove",    onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [text, alpha, weight, width, italic, scale]);

  return (
    <div
      ref={containerRef}
      className={`text-pressure ${className}`}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: flex ? "space-between" : "flex-start",
        width:          "100%",
        height:         "100%",
        fontFamily:     `'${fontFamily}', sans-serif`,
        userSelect:     "none",
      }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          ref={el => { charRefs.current[i] = el; }}
          className={`text-pressure__char${stroke ? " text-pressure__char--stroke" : ""}`}
          style={{
            display:    "inline-block",
            textAlign:  "center",
            fontSize:   `${minFontSize}px`,
            lineHeight: 1,
            color:      textColor,
            flex:       flex && char !== " " ? 1 : undefined,
            minWidth:   char === " " ? `${minFontSize * 0.3}px` : undefined,
            willChange: "font-variation-settings, opacity",
            "--stroke-color": strokeColor,
          } as React.CSSProperties}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </div>
  );
}
