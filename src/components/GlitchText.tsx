"use client";

import "./GlitchText.css";

type Props = {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  glitchShadowA?: string;
  glitchShadowB?: string;
};

export default function GlitchText({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = true,
  className = "",
  glitchShadowA = "#FF3B1F",
  glitchShadowB = "#00C2A8",
}: Props) {
  return (
    <span
      className={`glitch-text ${enableOnHover ? "glitch-text--hover-only" : "glitch-text--always"} ${className}`}
      data-glitch={children}
      style={{
        "--glitch-a": enableShadows ? glitchShadowA : "transparent",
        "--glitch-b": enableShadows ? glitchShadowB : "transparent",
        "--glitch-speed": `${0.4 / speed}s`,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
