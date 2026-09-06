"use client";

import { useEffect, useRef } from "react";

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  src: string;
  inkColor?: string;
  paperColor?: string;
  mode?: "mono";
  dotDensity?: number;   // dots per 1000px reference width — e.g. 80 → ~12.5px spacing
  angle?: number;        // degrees
  revealRadius?: number; // fraction of canvas height
  trigger?: "hover";
  idleReveal?: number;   // 0-1, baseline reveal everywhere (good for touch fallback)
  follow?: number;       // cursor lag in seconds — higher = smoother/more trailing (0 = instant)
  style?: React.CSSProperties;
  className?: string;
};

// ── Colour helper ──────────────────────────────────────────────────────────────
function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ── Shaders ────────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform vec2  uResolution;   // canvas dims in physical pixels
uniform vec2  uCursor;       // cursor in UV space (0-1, y up)
uniform float uRevealRadius; // fraction of canvas height (aspect-corrected)
uniform float uIdleReveal;   // constant baseline reveal
uniform float uDotSpacing;   // halftone grid spacing in physical pixels
uniform float uAngleCos;
uniform float uAngleSin;
uniform vec3  uInkColor;
uniform vec3  uPaperColor;
uniform float uImgAspect;    // image natural width / height

varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Cover-fit: map canvas UV to image UV without distortion
vec2 coverUV(vec2 uv) {
  float cAspect = uResolution.x / uResolution.y;
  float iAspect = uImgAspect;
  if (cAspect > iAspect) {
    // canvas wider than image — shrink y
    float s = iAspect / cAspect;
    return vec2(uv.x, (uv.y - 0.5) / s + 0.5);
  } else {
    // canvas taller than image — shrink x
    float s = cAspect / iAspect;
    return vec2((uv.x - 0.5) / s + 0.5, uv.y);
  }
}

void main() {
  vec2 uv = vUv;

  // ── Halftone grid ──────────────────────────────────────────────────────────
  vec2 px = uv * uResolution;

  // Rotate pixel position into grid space
  vec2 pxRot = vec2(
    px.x * uAngleCos - px.y * uAngleSin,
    px.x * uAngleSin + px.y * uAngleCos
  );

  // Grid cell: center of the nearest dot in rotated space
  vec2 cellCenterRot = (floor(pxRot / uDotSpacing) + 0.5) * uDotSpacing;

  // Distance from this pixel to its dot center (for the dot mask)
  float dotDist = length(pxRot - cellCenterRot);

  // Un-rotate cell center back to pixel space → UV
  vec2 cellCenterPx = vec2(
    cellCenterRot.x * uAngleCos + cellCenterRot.y * uAngleSin,
    -cellCenterRot.x * uAngleSin + cellCenterRot.y * uAngleCos
  );
  vec2 cellUV = cellCenterPx / uResolution;

  // Sample image at the dot's representative cell center
  vec4 dotSample = texture2D(uTexture, coverUV(cellUV));
  float dotLum    = luma(dotSample.rgb);

  // Dot radius: large dot = dark area (standard print convention)
  float maxR    = uDotSpacing * 0.5 * 0.88;
  float dotR    = maxR * sqrt(1.0 - clamp(dotLum, 0.0, 1.0));
  float inDot   = step(dotDist, dotR);
  vec3  halftone = mix(uPaperColor, uInkColor, inDot);

  // ── Reveal ─────────────────────────────────────────────────────────────────
  // Aspect-correct so reveal is a real circle in screen space (not an ellipse)
  vec2  aspectScale = vec2(uResolution.x / uResolution.y, 1.0);
  float screenDist  = length((uv - uCursor) * aspectScale);
  float reveal      = smoothstep(uRevealRadius, uRevealRadius * 0.35, screenDist);
  reveal = max(reveal, uIdleReveal);

  // Actual image sample (cover-fitted)
  vec4 orig = texture2D(uTexture, coverUV(uv));

  gl_FragColor = vec4(mix(halftone, orig.rgb, reveal), 1.0);
}`;

// ── Component ──────────────────────────────────────────────────────────────────
export default function HalftoneReveal({
  src,
  inkColor   = "#0D0D0D",
  paperColor = "#1a1512",
  dotDensity = 80,
  angle      = 24,
  revealRadius = 0.32,
  idleReveal = 0.06,
  follow     = 0.37,
  style,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let rafId = 0;
    let cleanupFn: (() => void) | null = null;

    // Dynamic import keeps ogl out of the server bundle (belt-and-suspenders)
    import("ogl").then(({ Renderer, Program, Geometry, Mesh, Texture }) => {
      if (cancelled) return;

      const dpr = Math.min(window.devicePixelRatio, 2);
      const w   = container.clientWidth;
      const h   = container.clientHeight;

      // ── Renderer ────────────────────────────────────────────────────────────
      const renderer = new Renderer({ dpr, width: w, height: h, alpha: false });
      const gl = renderer.gl;
      Object.assign(gl.canvas.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
      });
      container.appendChild(gl.canvas);

      // ── Fullscreen quad geometry ─────────────────────────────────────────────
      const geometry = new Geometry(gl, {
        position: { size: 2, data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]) },
        uv:       { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) },
        index:    { data: new Uint16Array([0, 1, 2, 0, 2, 3]) },
      });

      // ── Texture ──────────────────────────────────────────────────────────────
      // wrapS/wrapT default to CLAMP_TO_EDGE in ogl — no mipmaps needed for a fullscreen quad
      const texture = new Texture(gl, { generateMipmaps: false });

      // Derived shader constants
      const inkVec     = hexToVec3(inkColor);
      const paperVec   = hexToVec3(paperColor);
      const angleRad   = (angle * Math.PI) / 180;
      const dotSpacing = (1000 / dotDensity) * dpr;  // physical pixels

      // ── Program ──────────────────────────────────────────────────────────────
      const uniforms = {
        uTexture:      { value: texture },
        uResolution:   { value: [w * dpr, h * dpr] },
        uCursor:       { value: [0.5, 0.5] },
        uRevealRadius: { value: revealRadius },
        uIdleReveal:   { value: idleReveal },
        uDotSpacing:   { value: dotSpacing },
        uAngleCos:     { value: Math.cos(angleRad) },
        uAngleSin:     { value: Math.sin(angleRad) },
        uInkColor:     { value: inkVec },
        uPaperColor:   { value: paperVec },
        uImgAspect:    { value: 1.0 },
      };

      const program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms });
      const mesh    = new Mesh(gl, { geometry, program });

      // ── Load image ───────────────────────────────────────────────────────────
      // Place a real guitar photo at public/images/cart-bg.jpg to enable the effect.
      // The canvas shows paper+halftone with no image detail until loaded.
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        program.uniforms.uImgAspect.value = img.naturalWidth / img.naturalHeight;
        texture.image = img;
      };
      img.src = src;

      // ── Mouse ────────────────────────────────────────────────────────────────
      // Separate target (updated instantly) from current (lerped in render loop)
      const cursorTarget  = [0.5, 0.5];
      const cursorCurrent = [0.5, 0.5];

      function onMouseMove(e: MouseEvent) {
        const rect = (container as HTMLDivElement).getBoundingClientRect();
        // Flip Y: browser Y=0 is top, WebGL UV Y=0 is bottom
        cursorTarget[0] = (e.clientX - rect.left) / rect.width;
        cursorTarget[1] = 1 - (e.clientY - rect.top) / rect.height;
      }
      // Listen on window so the reveal works even when other elements cover the canvas
      window.addEventListener("mousemove", onMouseMove);

      // ── Resize ───────────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        renderer.setSize(nw, nh);
        program.uniforms.uResolution.value = [nw * dpr, nh * dpr];
      });
      ro.observe(container);

      // ── Render loop ──────────────────────────────────────────────────────────
      // Frame-rate-independent lerp: lerpFactor = 1 - exp(-dt / follow)
      // follow=0.55 → ~8% per frame @ 60fps — smooth trailing loupe feel
      let lastTime = performance.now();

      function tick(timestamp: number) {
        rafId = requestAnimationFrame(tick);
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;
        const f = follow > 0 ? 1 - Math.exp(-dt / follow) : 1;
        cursorCurrent[0] += (cursorTarget[0] - cursorCurrent[0]) * f;
        cursorCurrent[1] += (cursorTarget[1] - cursorCurrent[1]) * f;
        uniforms.uCursor.value = [...cursorCurrent];
        renderer.render({ scene: mesh });
      }
      rafId = requestAnimationFrame(tick);

      cleanupFn = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("mousemove", onMouseMove);
        ro.disconnect();
        if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      };
    }).catch((err) => {
      console.warn("HalftoneReveal: failed to init WebGL:", err);
    });

    return () => {
      cancelled = true;
      if (cleanupFn) cleanupFn();
    };
    // Props used in the closure are stable (primitives/strings) so the deps array is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, inkColor, paperColor, dotDensity, angle, revealRadius, idleReveal, follow]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    />
  );
}
