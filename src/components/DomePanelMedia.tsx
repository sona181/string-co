"use client";

import { useState } from "react";
import ModelViewer from "./ModelViewer";

type Props = {
  photoSrc: string | null;
  model3dUrl: string | null;
  productName: string;
  photoRatio?: number;
};

type Slide = { type: "photo"; src: string } | { type: "3d"; url: string };

function usePhotoFit(seed?: number) {
  // Start with seed ratio if known, otherwise null (unknown until image loads)
  const [ratio, setRatio] = useState<number | null>(seed ?? null);
  const isPortrait = ratio !== null && ratio < 0.85;

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (ratio !== null) return; // already known
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  return { isPortrait, onLoad };
}

export default function DomePanelMedia({ photoSrc, model3dUrl, productName, photoRatio }: Readonly<Props>) {
  const { isPortrait, onLoad } = usePhotoFit(photoRatio);
  const [slideIdx, setSlideIdx] = useState(0);

  const slides: Slide[] = [
    ...(photoSrc  ? [{ type: "photo" as const, src: photoSrc  }] : []),
    ...(model3dUrl ? [{ type: "3d"    as const, url: model3dUrl }] : []),
  ];

  if (slides.length === 0) return null;

  const bg  = isPortrait ? "#fff" : "#000";
  const fit = "contain";

  // Single-slide: no carousel chrome needed
  if (slides.length === 1) {
    const s = slides[0];
    if (s.type === "photo") {
      return (
        <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={s.src}
            alt={productName}
            draggable={false}
            onLoad={onLoad}
            style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }}
          />
        </div>
      );
    }
    return <ModelViewer url={s.url} style={{ width: "100%", height: "100%" }} />;
  }

  const canPrev = slideIdx > 0;
  const canNext = slideIdx < slides.length - 1;
  const cur = slides[slideIdx];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#111" }}>

      {/* Slide strip */}
      <div
        style={{
          display: "flex",
          width: `${slides.length * 100}%`,
          height: "100%",
          transform: `translateX(${-slideIdx * (100 / slides.length)}%)`,
          transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {slides.map((s, i) => (
          <div key={s.type === "photo" ? s.src : s.url} style={{ width: `${100 / slides.length}%`, flexShrink: 0, height: "100%", background: s.type === "photo" ? bg : "#111" }}>
            {s.type === "photo" ? (
              <img
                src={s.src}
                alt={productName}
                draggable={false}
                onLoad={onLoad}
                style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }}
              />
            ) : (
              <ModelViewer url={s.url} style={{ width: "100%", height: "100%" }} />
            )}
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {canPrev && (
        <button
          onClick={() => setSlideIdx(i => i - 1)}
          style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.85)", cursor: "pointer",
            fontSize: 20, fontWeight: 700, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            color: "#111",
          }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Right arrow */}
      {canNext && (
        <button
          onClick={() => setSlideIdx(i => i + 1)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.85)", cursor: "pointer",
            fontSize: 20, fontWeight: 700, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            color: "#111",
          }}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Pill dot indicators */}
      <div
        style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 5, zIndex: 10,
        }}
      >
        {slides.map((s, i) => (
          <button
            key={s.type === "photo" ? s.src : s.url}
            onClick={() => setSlideIdx(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === slideIdx ? 20 : 8, height: 8,
              borderRadius: 4, border: "none",
              background: i === slideIdx ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.38)",
              cursor: "pointer", padding: 0,
              transition: "all 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* 3D badge */}
      {cur.type === "3d" && (
        <div
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            padding: "4px 9px", borderRadius: 8,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
            pointerEvents: "none",
          }}
        >
          ⟳ 3D · drag to rotate
        </div>
      )}
    </div>
  );
}
