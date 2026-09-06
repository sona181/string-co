"use client";

import { useEffect, useMemo, useRef, useCallback, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import "./DomeGallery.css";
import "./GlitchText.css";
import "./EchoText.css";
import "./SplitFlapText.css";
import EchoText from "./EchoText";
import SplitFlapText from "./SplitFlapText";
import FuzzyText from "./FuzzyText";
import TextPressure from "./TextPressure";
import "./TextPressure.css";
import CurvedLoop from "./CurvedLoop";
import "./CurvedLoop.css";
import SplitText from "./SplitText";
import "./SplitText.css";
import type { CardPalette, TitleAnimation } from "@/lib/themes";
import type { ProductData } from "@/lib/shopTypes";
import { toggleWishlist, addToCart } from "@/app/actions/shop";
import { notifyCartAdded } from "@/lib/cartStore";
import Model3dTile from "@/components/Model3dTile";
import DomePanelMedia from "@/components/DomePanelMedia";
import ReviewPanel from "@/components/ReviewPanel";
import type { ReviewItem } from "@/components/ReviewPanel";
import CheckoutPanel from "@/components/CheckoutPanel";

type ImageInput = string | { src: string; alt?: string; width?: number; height?: number };

type Props = {
  images?: ImageInput[];
  fit?: number;
  fitBasis?: "auto" | "min" | "max" | "width" | "height";
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  onImageClick?: (src: string) => void;
  cardPalettes?: CardPalette[];
  titleAnimation?: TitleAnimation;
  products?: ProductData[];
  userId?: string | null;
};

// HTML-escape user-generated strings before injecting into innerHTML
const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Converts a plain-text description into structured HTML.
// Supports: bullet lines (-, *, •), numbered lines (1.), Key: Value lines, and plain paragraphs.
// Each segment is safely escaped before injection.
function formatDescription(raw: string, textColor: string): string {
  if (!raw.trim()) return "";

  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  const bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    out.push(
      `<ul style="margin:2px 0;padding-left:15px;display:flex;flex-direction:column;gap:2px;list-style:disc">` +
      bullets.join("") +
      `</ul>`,
    );
    bullets.length = 0;
  };

  const pStyle = `margin:0;font-size:11px;line-height:1.65;color:${textColor};opacity:0.85`;
  const liStyle = `font-size:11px;line-height:1.6;color:${textColor};opacity:0.85`;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) { flushBullets(); continue; }

    // Bullet: -, *, • or numbered list
    const bulletM = line.match(/^[-*•]\s+(.+)$/) ?? line.match(/^\d+[.)]\s+(.+)$/);
    if (bulletM) {
      bullets.push(`<li style="${liStyle}">${esc(bulletM[1])}</li>`);
      continue;
    }

    flushBullets();

    // Key: Value — bold the key
    const kvM = line.match(/^([^:]{1,30}):\s+(.+)$/);
    if (kvM) {
      out.push(
        `<p style="${pStyle}"><span style="font-weight:800;opacity:1">${esc(kvM[1])}:</span> ${esc(kvM[2])}</p>`,
      );
      continue;
    }

    out.push(`<p style="${pStyle}">${esc(line)}</p>`);
  }

  flushBullets();

  return `<div style="display:flex;flex-direction:column;gap:4px">${out.join("")}</div>`;
}

function renderStars(rating: number, count: number, textColor: string, subtextColor: string): string {
  const full = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
  return `<div style="font-size:12px;color:${textColor};display:flex;align-items:center;gap:5px">${stars}<span style="font-size:11px;color:${subtextColor}">${rating.toFixed(1)} (${count})</span></div>`;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;

const DEFAULT_CARD_PALETTE: CardPalette = {
  bg: "var(--theme-card-bg,#F2EFE4)",
  text: "var(--theme-card-text,#0D0D0D)",
  subtext: "var(--theme-panel-subtext,#8A8578)",
  eyebrow: "var(--theme-accent,#FF3B1F)",
  divider: "var(--theme-accent-2,#F7D726)",
  border: "var(--theme-accent,#FF3B1F)",
  glitchA: "var(--theme-glitch-a,#FF3B1F)",
  glitchB: "var(--theme-glitch-b,#00C2A8)",
};

const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

type ItemData = { x: number; y: number; sizeX: number; sizeY: number; src: string; alt: string; productIdx: number };

const SLOTS_PER_COL = 5;

// Seeded LCG so the shuffle is identical on server and client (fixes hydration mismatch).
// Math.random() produces a different sequence each render; this produces the same one
// for the same pool contents, which is all useMemo needs.
function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function buildItems(pool: ImageInput[], seg: number): ItemData[] {
  const normalized = pool.length === 0
    ? []
    : pool.map((img, origIdx) => ({
        src: typeof img === "string" ? img : (img.src ?? ""),
        alt: typeof img === "string" ? "" : (img.alt ?? ""),
        origIdx,
      }));

  if (normalized.length === 0) return [];

  // Derive a deterministic seed from the image URLs so SSR and hydration produce
  // the same shuffle (Math.random() would differ each call and break hydration).
  const seed = normalized.reduce((acc, { src }) =>
    src.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, acc), 0);
  const rand = seededRandom(seed);

  // Shuffle once so tie-breaking doesn't always favour pool[0]
  const candidates = [...normalized];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Full dome: all seg columns × SLOTS_PER_COL rows (repeats are fine, clustering is not)
  const xCols  = Array.from({ length: seg }, (_, i) => i * 2 - (seg - 1));
  const HALF_H = SLOTS_PER_COL; // = (SLOTS_PER_COL * 2) / 2

  // Track the last (col, row) where each src was placed
  const lastPlaced = new Map<string, { col: number; row: number }>();

  const items: ItemData[] = [];

  for (let colIdx = 0; colIdx < seg; colIdx++) {
    const x       = xCols[colIdx];
    const stagger = colIdx % 2 === 1 ? 1 : 0;
    let rowUnit   = -HALF_H + stagger;

    for (let rowSlot = 0; rowSlot < SLOTS_PER_COL; rowSlot++) {
      // Pick the candidate whose last placement is furthest away (Manhattan distance).
      // If multiple candidates tie, the shuffled order breaks the tie randomly.
      // If the pool is tiny and every candidate is nearby, we still pick the least-bad one.
      let bestIdx   = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const last  = lastPlaced.get(candidates[i].src);
        const score = last === undefined
          ? 999  // never placed → highest priority
          : Math.abs(colIdx - last.col) + Math.abs(rowSlot - last.row);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      }

      const chosen = candidates[bestIdx];
      items.push({
        x,
        y: rowUnit + 0.5,
        sizeX: 2, sizeY: 2,
        src: chosen.src, alt: chosen.alt,
        productIdx: chosen.origIdx,
      });

      lastPlaced.set(chosen.src, { col: colIdx, row: rowSlot });
      rowUnit += 2;
    }
  }

  return items;
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2;
  return { rotateX: unit * (offsetY - (sizeY - 1) / 2), rotateY: unit * (offsetX + (sizeX - 1) / 2) };
}


export default function DomeGallery({
  images = [],
  fit = 0.5,
  fitBasis = "auto",
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "#0D0D0D",
  maxVerticalRotationDeg = 25,
  enlargeTransitionMs = 300,
  segments = 35,
  openedImageWidth = "400px",
  openedImageHeight = "400px",
  imageBorderRadius = "16px",
  openedImageBorderRadius = "16px",
  grayscale = false,
  onImageClick,
  cardPalettes,
  titleAnimation = "glitch",
  products,
  userId,
}: Props) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const mainRef   = useRef<HTMLElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef  = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef  = useRef<HTMLDivElement>(null);

  const focusedElRef            = useRef<HTMLElement | null>(null);
  const originalTilePositionRef = useRef<DOMRect | null>(null);
  const openingRef              = useRef(false);
  const echoRootRef             = useRef<Root | null>(null);
  const modelRootRef            = useRef<Root | null>(null);
  const reviewRootRef           = useRef<Root | null>(null);
  const checkoutRootRef         = useRef<Root | null>(null);

  const openStartedAtRef        = useRef(0);
  const scrollLockedRef         = useRef(false);
  const cardRef                 = useRef<HTMLDivElement | null>(null);
  const infoPanelRef            = useRef<HTMLDivElement | null>(null);
  const reviewsPanelRef         = useRef<HTMLDivElement | null>(null);
  const panelSideRef            = useRef<"left" | "right">("right");
  // checkout state — checkoutPanelRef points to the active checkout card DOM node;
  // hiddenInfoPanelRef retains the info panel DOM while checkout is shown (preserves event listeners)
  const checkoutPanelRef        = useRef<HTMLDivElement | null>(null);
  const hiddenInfoPanelRef      = useRef<HTMLDivElement | null>(null);

  // Image natural aspect ratios (width/height) — pre-seeded from stored dimensions,
  // with client-side fallback for any image that doesn't have stored dimensions.
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>(() => {
    const seed: Record<string, number> = {};
    images.forEach(img => {
      if (typeof img !== "string" && img.width && img.height && img.src)
        seed[img.src] = img.width / img.height;
    });
    return seed;
  });
  // Ref mirrors so imperative callbacks always see fresh values
  // without needing to be recreated when these change.
  const aspectRatiosRef   = useRef(aspectRatios);
  useEffect(() => { aspectRatiosRef.current = aspectRatios; }, [aspectRatios]);
  const cardPalettesRef = useRef(cardPalettes);
  useEffect(() => { cardPalettesRef.current = cardPalettes; }, [cardPalettes]);


  // ── Measure aspect ratios client-side only for images without stored dimensions ──
  useEffect(() => {
    const urls = [...new Set(
      images
        .map(img => (typeof img === "string" ? img : img.src))
        .filter(Boolean),
    )].filter(url => !(url in aspectRatios));

    if (urls.length === 0) return;
    const updates: Record<string, number> = {};
    let pending = urls.length;

    const done = () => {
      pending--;
      if (pending === 0 && Object.keys(updates).length > 0)
        setAspectRatios(prev => ({ ...prev, ...updates }));
    };

    urls.forEach(url => {
      const img = new window.Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight)
          updates[url] = img.naturalWidth / img.naturalHeight;
        done();
      };
      img.onerror = done;
      img.src = url;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // ── Drag-controlled rotation ───────────────────────────────────────────────
  const currentRotRef  = useRef({ x: 0, y: 0 });
  const targetRotRef   = useRef({ x: 0, y: 0 });
  const rafRef         = useRef<number | null>(null);
  const isDraggingRef        = useRef(false);
  const lastDragPos          = useRef<{ x: number; y: number } | null>(null);
  const pointerDownPos       = useRef<{ x: number; y: number } | null>(null);
  const didMoveRef           = useRef(false);
  const pointerDownTargetRef = useRef<HTMLElement | null>(null);
  const openItemFromElementRef = useRef<((el: HTMLElement) => void) | null>(null);

  const applyTransform = (xDeg: number, yDeg: number) => {
    if (sphereRef.current)
      sphereRef.current.style.transform =
        `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  };

  const tick = useCallback(() => {
    const t = targetRotRef.current;
    const c = currentRotRef.current;
    const dx = t.x - c.x;
    const dy = t.y - c.y;
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
      const nx = c.x + dx * 0.18;
      const ny = c.y + dy * 0.18;
      currentRotRef.current = { x: nx, y: ny };
      applyTransform(nx, ny);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      if (focusedElRef.current) return;
      isDraggingRef.current = true;
      lastDragPos.current    = { x: e.clientX, y: e.clientY };
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      didMoveRef.current     = false;
      pointerDownTargetRef.current = (e.target as HTMLElement).closest(".item__image") as HTMLElement | null;
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !lastDragPos.current) return;
      if (focusedElRef.current) return;
      const dx = e.clientX - lastDragPos.current.x;
      const dy = e.clientY - lastDragPos.current.y;
      lastDragPos.current = { x: e.clientX, y: e.clientY };
      if (pointerDownPos.current) {
        const tdx = e.clientX - pointerDownPos.current.x;
        const tdy = e.clientY - pointerDownPos.current.y;
        if (tdx * tdx + tdy * tdy > 25) didMoveRef.current = true;
      }
      targetRotRef.current = {
        x: clamp(targetRotRef.current.x - dy * 0.3, -maxVerticalRotationDeg, maxVerticalRotationDeg),
        y: targetRotRef.current.y + dx * 0.5,
      };
    };

    const onUp = () => {
      isDraggingRef.current = false;
      lastDragPos.current   = null;
      if (!didMoveRef.current && pointerDownTargetRef.current && !openingRef.current) {
        openItemFromElementRef.current?.(pointerDownTargetRef.current);
      }
      pointerDownTargetRef.current = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup",   onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup",   onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [maxVerticalRotationDeg]);

  // ── Resize observer ────────────────────────────────────────────────────────
  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
      const minDim = Math.min(w, h), maxDim = Math.max(w, h), aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case "min":    basis = minDim; break;
        case "max":    basis = maxDim; break;
        case "width":  basis = w; break;
        case "height": basis = h; break;
        default:       basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = Math.min(basis * fit, h * 1.35);
      radius = clamp(radius, minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);
      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      root.style.setProperty("--tile-radius", imageBorderRadius);
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
      applyTransform(currentRotRef.current.x, currentRotRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius]);

  // ── Scroll lock helpers ────────────────────────────────────────────────────
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add("dg-scroll-lock");
  }, []);

  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute("data-enlarging") === "true") return;
    scrollLockedRef.current = false;
    document.body.classList.remove("dg-scroll-lock");
  }, []);

  // ── Scrim close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement!;
      const overlay = viewerRef.current?.querySelector(".enlarge") as HTMLElement | null;
      if (!overlay) return;
      const refDiv = parent.querySelector(".item__image--reference") as HTMLElement | null;
      const originalPos = originalTilePositionRef.current;

      // ── Fast close (no animation data) ──────────────────────────────────
      if (!originalPos) {
        overlay.remove(); refDiv?.remove();
        if (echoRootRef.current)     { echoRootRef.current.unmount();     echoRootRef.current     = null; }
        if (modelRootRef.current)    { modelRootRef.current.unmount();    modelRootRef.current    = null; }
        if (reviewRootRef.current)   { reviewRootRef.current.unmount();   reviewRootRef.current   = null; }
        if (checkoutRootRef.current) { checkoutRootRef.current.unmount(); checkoutRootRef.current = null; }

        if (cardRef.current)            { cardRef.current.remove();            cardRef.current            = null; }
        if (infoPanelRef.current)       { infoPanelRef.current.remove();       infoPanelRef.current       = null; }
        if (reviewsPanelRef.current)    { reviewsPanelRef.current.remove();    reviewsPanelRef.current    = null; }
        if (checkoutPanelRef.current)   { checkoutPanelRef.current.remove();   checkoutPanelRef.current   = null; }
        if (hiddenInfoPanelRef.current) { hiddenInfoPanelRef.current.remove(); hiddenInfoPanelRef.current = null; }
        parent.style.setProperty("--rot-y-delta", "0deg");
        parent.style.setProperty("--rot-x-delta", "0deg");
        el.style.visibility = ""; el.style.zIndex = "0";
        focusedElRef.current = null;
        rootRef.current?.removeAttribute("data-enlarging");
        openingRef.current = false; unlockScroll(); return;
      }

      // ── Animated close ───────────────────────────────────────────────────
      const currentRect = overlay.getBoundingClientRect();
      const rootRect = rootRef.current!.getBoundingClientRect();
      const animatingOverlay = document.createElement("div");
      animatingOverlay.className = "enlarge-closing";
      animatingOverlay.style.cssText = `position:absolute;left:${currentRect.left - rootRect.left}px;top:${currentRect.top - rootRect.top}px;width:${currentRect.width}px;height:${currentRect.height}px;z-index:9999;border-radius:var(--enlarge-radius,32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
      const originalImg = overlay.querySelector("img");
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement;
        const origFit = originalImg.style.objectFit || "cover";
        img.style.cssText = `width:100%;height:100%;object-fit:${origFit};`;
        animatingOverlay.appendChild(img);
      }
      overlay.remove();
      rootRef.current!.appendChild(animatingOverlay);

      if (echoRootRef.current)     { echoRootRef.current.unmount();     echoRootRef.current     = null; }
      if (modelRootRef.current)    { modelRootRef.current.unmount();    modelRootRef.current    = null; }
      if (reviewRootRef.current)   { reviewRootRef.current.unmount();   reviewRootRef.current   = null; }
      if (checkoutRootRef.current) { checkoutRootRef.current.unmount(); checkoutRootRef.current = null; }

      // panels retract immediately
      if (infoPanelRef.current) {
        const p = infoPanelRef.current; infoPanelRef.current = null;
        const retractTx = panelSideRef.current === "right" ? `translateX(-40px)` : `translateX(40px)`;
        p.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
        p.style.opacity = "0"; p.style.transform = retractTx;
        setTimeout(() => p.remove(), enlargeTransitionMs);
      }
      if (reviewsPanelRef.current) {
        const rp = reviewsPanelRef.current; reviewsPanelRef.current = null;
        const revRetractTx = panelSideRef.current === "right" ? `translateX(40px)` : `translateX(-40px)`;
        rp.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
        rp.style.opacity = "0"; rp.style.transform = revRetractTx;
        setTimeout(() => rp.remove(), enlargeTransitionMs);
      }
      if (cardRef.current) {
        const c = cardRef.current; cardRef.current = null;
        c.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;
        c.style.opacity = "0"; c.style.transform = "scale(0.92)";
        setTimeout(() => c.remove(), enlargeTransitionMs);
      }

      if (checkoutPanelRef.current) {
        const cp = checkoutPanelRef.current; checkoutPanelRef.current = null;
        const cpTx = panelSideRef.current === "right" ? `translateX(-40px)` : `translateX(40px)`;
        cp.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
        cp.style.opacity = "0"; cp.style.transform = cpTx;
        setTimeout(() => cp.remove(), enlargeTransitionMs);
      }
      if (hiddenInfoPanelRef.current) {
        hiddenInfoPanelRef.current.remove(); hiddenInfoPanelRef.current = null;
      }

      void animatingOverlay.getBoundingClientRect();
      setTimeout(() => {
        requestAnimationFrame(() => {
          animatingOverlay.style.left    = `${originalPos.left - rootRect.left}px`;
          animatingOverlay.style.top     = `${originalPos.top  - rootRect.top}px`;
          animatingOverlay.style.width   = `${originalPos.width}px`;
          animatingOverlay.style.height  = `${originalPos.height}px`;
          animatingOverlay.style.opacity = "0";
        });
      }, 100);

      const cleanup = () => {
        animatingOverlay.remove();
        originalTilePositionRef.current = null;
        refDiv?.remove();
        parent.style.transition = "none"; el.style.transition = "none";
        parent.style.setProperty("--rot-y-delta", "0deg");
        parent.style.setProperty("--rot-x-delta", "0deg");
        requestAnimationFrame(() => {
          el.style.visibility = ""; el.style.opacity = "0"; el.style.zIndex = "0";
          focusedElRef.current = null;
          rootRef.current?.removeAttribute("data-enlarging");
          requestAnimationFrame(() => {
            parent.style.transition = "";
            el.style.transition = "opacity 300ms ease-out";
            requestAnimationFrame(() => {
              el.style.opacity = "1";
              setTimeout(() => {
                el.style.transition = ""; el.style.opacity = "";
                openingRef.current = false;
                if (rootRef.current?.getAttribute("data-enlarging") !== "true")
                  document.body.classList.remove("dg-scroll-lock");
              }, 300);
            });
          });
        });
      };
      animatingOverlay.addEventListener("transitionend", cleanup, { once: true });
    };
    scrim.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { scrim.removeEventListener("click", close); window.removeEventListener("keydown", onKey); };
  }, [enlargeTransitionMs, unlockScroll]);

  // ── Open image ─────────────────────────────────────────────────────────────
  const openItemFromElement = useCallback((el: HTMLElement) => {
    if (openingRef.current) return;
    openingRef.current = true;
    openStartedAtRef.current = performance.now();
    lockScroll();
    const parent = el.parentElement!;
    focusedElRef.current = el;
    const offsetX = getDataNumber(parent, "offsetX", 0);
    const offsetY = getDataNumber(parent, "offsetY", 0);
    const sizeX   = getDataNumber(parent, "sizeX", 2);
    const sizeY   = getDataNumber(parent, "sizeY", 2);
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const parentY = normalizeAngle(parentRot.rotateY);
    const globalY = normalizeAngle(currentRotRef.current.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    parent.style.setProperty("--rot-y-delta", `${rotY}deg`);
    parent.style.setProperty("--rot-x-delta", `${-parentRot.rotateX - currentRotRef.current.x}deg`);
    const refDiv = document.createElement("div");
    refDiv.className = "item__image item__image--reference";
    refDiv.style.opacity = "0";
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);
    void refDiv.offsetHeight;
    const tileR  = refDiv.getBoundingClientRect();
    const mainR  = mainRef.current?.getBoundingClientRect();
    const frameR = frameRef.current?.getBoundingClientRect();
    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      openingRef.current = false; focusedElRef.current = null; parent.removeChild(refDiv); unlockScroll(); return;
    }
    originalTilePositionRef.current = tileR;
    el.style.visibility = "hidden"; el.style.zIndex = "0";
    const overlay = document.createElement("div");
    overlay.className = "enlarge";
    overlay.style.cssText = `position:absolute;left:${frameR.left - mainR.left}px;top:${frameR.top - mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${enlargeTransitionMs}ms ease,opacity ${enlargeTransitionMs}ms ease;`;
    const rawSrc = parent.dataset.src ?? el.querySelector("img")?.src ?? "";
    const productIdx0 = parseInt(parent.dataset.productIdx ?? "0", 10);
    const earlyProduct = products && products.length > 0 ? products[productIdx0] : undefined;
    const has3d = !!earlyProduct?.model3dUrl;
    overlay.style.overflow = "hidden";
    overlay.style.borderRadius = "var(--enlarge-radius,12px)";
    const srcRatio = aspectRatiosRef.current[rawSrc];
    if (!has3d) {
      overlay.style.background = "var(--theme-cardBackground, #1a1625)";
      const img = document.createElement("img");
      img.src = rawSrc;
      img.style.cssText = "width:100%;height:100%;object-fit:contain;";
      overlay.appendChild(img);
    } else {
      overlay.style.background = "#111";
    }
    viewerRef.current!.appendChild(overlay);
    const tx0 = tileR.left - frameR.left, ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width || 1, sy0 = tileR.height / frameR.height || 1;
    overlay.style.transform = `translate(${tx0}px,${ty0}px) scale(${sx0},${sy0})`;
    setTimeout(() => {
      if (!overlay.parentElement) return;
      overlay.style.opacity = "1";
      overlay.style.transform = "translate(0px,0px) scale(1,1)";
      rootRef.current?.setAttribute("data-enlarging", "true");
      if (onImageClick) onImageClick(rawSrc);
    }, 16);

    if (openedImageWidth || openedImageHeight) {
      const onFirstEnd = (ev: Event) => {
        if ((ev as TransitionEvent).propertyName !== "transform") return;
        overlay.removeEventListener("transitionend", onFirstEnd);
        const prevTransition = overlay.style.transition;
        overlay.style.transition = "none";

        // Compute final frame size that fits the image's natural aspect ratio
        // within the configured max bounds, rather than forcing a fixed square.
        const maxW = parseFloat(openedImageWidth)  || frameR.width;
        const maxH = parseFloat(openedImageHeight) || frameR.height;
        const imgEl = overlay.querySelector("img") as HTMLImageElement | null;
        const ratio = aspectRatiosRef.current[rawSrc]
          ?? (imgEl?.complete && imgEl.naturalWidth ? imgEl.naturalWidth / imgEl.naturalHeight : undefined);
        let finalW: number, finalH: number;
        if (ratio) {
          if (ratio >= maxW / maxH) { finalW = maxW; finalH = maxW / ratio; }
          else                       { finalH = maxH; finalW = maxH * ratio; }
        } else {
          // Ratio not yet known — use square; img.onload will look off until reopened
          finalW = Math.min(maxW, maxH); finalH = finalW;
        }
        finalW = Math.round(finalW); finalH = Math.round(finalH);
        const tempWidth  = `${finalW}px`;
        const tempHeight = `${finalH}px`;
        overlay.style.width = tempWidth; overlay.style.height = tempHeight;
        const newRect = overlay.getBoundingClientRect();
        overlay.style.width = `${frameR.width}px`; overlay.style.height = `${frameR.height}px`;
        void overlay.offsetWidth;
        overlay.style.transition = `left ${enlargeTransitionMs}ms ease-out,top ${enlargeTransitionMs}ms ease-out,width ${enlargeTransitionMs}ms ease-out,height ${enlargeTransitionMs}ms ease-out`;
        const centeredLeft = frameR.left - mainR.left + (frameR.width  - newRect.width)  / 2;
        const centeredTop  = frameR.top  - mainR.top  + (frameR.height - newRect.height) / 2;

        // ── Palette ────────────────────────────────────────────────────────
        const PAD  = 16;
        const pool = cardPalettesRef.current && cardPalettesRef.current.length > 0 ? cardPalettesRef.current : [DEFAULT_CARD_PALETTE];
        const palette = pool[Math.floor(Math.random() * pool.length)];

        // ── Product lookup ─────────────────────────────────────────────────
        const productIdx = parseInt(parent.dataset.productIdx ?? "0", 10);
        const product = products && products.length > 0 ? products[productIdx] : undefined;

        // ── Polaroid card ──────────────────────────────────────────────────
        if (cardRef.current) { cardRef.current.remove(); cardRef.current = null; }
        const card = document.createElement("div");
        card.style.cssText = [
          `position:absolute`,
          `left:${centeredLeft - PAD}px`,
          `top:${centeredTop - PAD}px`,
          `width:${newRect.width + PAD * 2}px`,
          `height:${newRect.height + PAD * 2}px`,
          `background:${palette.bg}`,
          `border:${palette.borderWidth ?? "2px"} solid ${palette.border}`,
          `border-radius:calc(var(--enlarge-radius,12px) + 12px)`,
          `z-index:29`,
          `opacity:0`,
          `transform:scale(0.92)`,
          `pointer-events:none`,
          `box-shadow:${palette.boxShadow ?? "0 24px 64px rgba(0,0,0,0.45)"}`,
        ].join(";");
        viewerRef.current!.appendChild(card);
        cardRef.current = card;
        void card.offsetWidth;
        card.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;

        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`; overlay.style.top = `${centeredTop}px`;
          overlay.style.width = tempWidth; overlay.style.height = tempHeight;
          card.style.opacity = "1";
          card.style.transform = "scale(1)";
        });
        overlay.addEventListener("transitionend", () => {
          overlay.style.transition = prevTransition;
          // Mount the media slider after the overlay has settled to its final size
          if (product?.model3dUrl) {
            if (modelRootRef.current) { modelRootRef.current.unmount(); modelRootRef.current = null; }
            overlay.style.pointerEvents = "auto";
            overlay.style.overflow = "hidden";
            // Pass the real photo URL only — not the placeholder stub
            const photoSrc = rawSrc && !rawSrc.includes("placehold.co") ? rawSrc : null;
            const root = createRoot(overlay);
            modelRootRef.current = root;
            root.render(createElement(DomePanelMedia, {
              photoSrc,
              model3dUrl: product.model3dUrl,
              productName: product.name,
              photoRatio: photoSrc ? (aspectRatiosRef.current[photoSrc] ?? aspectRatiosRef.current[rawSrc]) : undefined,
            }));
          }
        }, { once: true });

        // ── Info panel ────────────────────────────────────────────────────
        const side = Math.random() < 0.5 ? "left" : "right";
        panelSideRef.current = side;

        const PANEL_MAX_W = 340;
        const panelLeft = side === "right"
          ? centeredLeft + newRect.width + PAD + 8
          : centeredLeft - PAD - 8 - PANEL_MAX_W;
        const panelTop = centeredTop - PAD;
        const initTx   = side === "right"
          ? `-${PANEL_MAX_W + PAD + 8}px` : `${PANEL_MAX_W + PAD + 8}px`;

        const titleText = product?.name ?? (el.querySelector("img")?.alt || el.getAttribute("aria-label") || "Guitar");
        const safeTitle = esc(titleText);

        // Title slot — type-specific React mount point
        const titleSlot = titleAnimation === "echo"
          ? `<div class="echo-title-slot" style="min-height:2em;overflow:hidden"></div>`
          : titleAnimation === "splitflap"
            ? `<div class="splitflap-title-slot" style="min-height:2em;overflow:hidden"></div>`
            : titleAnimation === "fuzzy"
              ? `<div class="fuzzy-title-slot" style="min-height:2em;overflow:hidden"></div>`
              : titleAnimation === "pressure"
                ? `<div class="pressure-title-slot" style="position:relative;height:80px;overflow:visible"></div>`
                : titleAnimation === "curvedLoop"
                  ? `<div class="curvedloop-title-slot" style="height:70px;overflow:hidden"></div>`
                  : titleAnimation === "splitText"
                    ? `<div class="splittext-title-slot" style="min-height:2em;overflow:hidden"></div>`
                    : `<span class="glitch-text glitch-text--hover-only" data-glitch="${safeTitle}" style="font-size:15px;font-weight:900;font-family:var(--theme-font-eyebrow,sans-serif);text-transform:uppercase;letter-spacing:0.18em;color:${palette.eyebrow};cursor:default;line-height:1.2">${safeTitle}</span>`;

        // Static panel content (safe strings only)
        const brandCatHtml = product
          ? `<p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${palette.subtext}">${esc(product.brandName)} — ${esc(product.categoryName)}</p>`
          : "";

        const priceHtml = product
          ? `<p style="margin:0;font-size:20px;font-weight:900;letter-spacing:-0.02em;color:${palette.text}">${fmt.format(product.priceWithDelta)}</p>`
          : "";

        const descHtml = formatDescription(
          product?.description ?? "Premium quality instrument, carefully crafted for players who demand the best tone and playability.",
          palette.text,
        );

        // Customization swatches (BODY_COLOR group only — most visual)
        let swatchesHtml = "";
        if (product?.hasCustomizations) {
          const bodyGroup = product.customizationGroups.find(g => g.type === "BODY_COLOR");
          if (bodyGroup && bodyGroup.options.length > 0) {
            const MAX_SW = 6;
            const shown = bodyGroup.options.slice(0, MAX_SW);
            const extra = bodyGroup.options.length - shown.length;
            const dots = shown.map(o =>
              o.hexOrValue
                ? `<span title="${esc(o.name)}" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${esc(o.hexOrValue)};border:1.5px solid rgba(0,0,0,0.18);flex-shrink:0"></span>`
                : `<span title="${esc(o.name)}" style="display:inline-block;width:11px;height:11px;border-radius:50%;border:1.5px solid ${palette.divider};flex-shrink:0"></span>`
            ).join("");
            const extraLabel = extra > 0 ? `<span style="font-size:10px;color:${palette.subtext}">+${extra}</span>` : "";
            const countLabel = `<span style="font-size:10px;color:${palette.subtext}">${bodyGroup.options.length} finish${bodyGroup.options.length !== 1 ? "es" : ""}</span>`;
            swatchesHtml = `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${dots}${extraLabel}${countLabel}</div>`;
          }
        }

        // Star rating (only if reviews exist)
        const ratingHtml = product && product.avgRating !== null
          ? renderStars(product.avgRating, product.reviewCount, palette.eyebrow, palette.subtext)
          : "";

        const dividerHtml = `<div style="width:40px;height:1.5px;background:${palette.divider};border-radius:1px"></div>`;

        if (infoPanelRef.current) { infoPanelRef.current.remove(); infoPanelRef.current = null; }
        if (reviewsPanelRef.current) { reviewsPanelRef.current.remove(); reviewsPanelRef.current = null; }

        const panel = document.createElement("div");
        panel.style.cssText = [
          `position:absolute`,
          `left:${panelLeft}px`,
          `top:${panelTop}px`,
          `min-width:220px`,
          `max-width:${PANEL_MAX_W}px`,
          `max-height:calc(100vh - 40px)`,
          `overflow-y:auto`,
          `background:${palette.bg}`,
          `border:${palette.borderWidth ?? "2px"} solid ${palette.border}`,
          `border-radius:calc(var(--enlarge-radius,12px) + 12px)`,
          `z-index:29`,
          `opacity:0`,
          `transform:translateX(${initTx})`,
          `pointer-events:auto`,
          `box-shadow:${palette.boxShadow ?? "0 24px 64px rgba(0,0,0,0.35)"}`,
          `display:flex`,
          `flex-direction:column`,
          `padding:24px 20px`,
          `gap:10px`,
        ].join(";");
        panel.style.setProperty("--glitch-a", palette.glitchA);
        panel.style.setProperty("--glitch-b", palette.glitchB);

        panel.innerHTML = [
          titleSlot,
          brandCatHtml,
          priceHtml,
          `<div data-desc-slot></div>`,
          swatchesHtml,
          ratingHtml,
          dividerHtml,
        ].join("");

        // ── Scrollable description ─────────────────────────────────────────
        const descSlot = panel.querySelector("[data-desc-slot]") as HTMLElement | null;
        if (descSlot && descHtml) {
          const wrap = document.createElement("div");
          wrap.style.cssText = `max-height:120px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:${palette.eyebrow} ${palette.divider}44`;
          wrap.innerHTML = descHtml;
          descSlot.replaceWith(wrap);
        }

        // Capture React mount slots before any further DOM changes
        const echoSlot       = titleAnimation === "echo"       ? panel.querySelector(".echo-title-slot")       as HTMLElement | null : null;
        const splitflapSlot  = titleAnimation === "splitflap"  ? panel.querySelector(".splitflap-title-slot")  as HTMLElement | null : null;
        const fuzzySlot      = titleAnimation === "fuzzy"      ? panel.querySelector(".fuzzy-title-slot")      as HTMLElement | null : null;
        const pressureSlot   = titleAnimation === "pressure"   ? panel.querySelector(".pressure-title-slot")   as HTMLElement | null : null;
        const curvedLoopSlot = titleAnimation === "curvedLoop" ? panel.querySelector(".curvedloop-title-slot") as HTMLElement | null : null;
        const splitTextSlot  = titleAnimation === "splitText"  ? panel.querySelector(".splittext-title-slot")  as HTMLElement | null : null;

        // ── Action buttons ─────────────────────────────────────────────────
        const btnShared = `height:38px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;padding:0 12px;transition:opacity 0.15s ease`;

        // Buy now (primary — filled) ─────────────────────────────────────
        const buyNowBtn = document.createElement("button");
        buyNowBtn.textContent = "Buy now";
        buyNowBtn.style.cssText = `${btnShared};flex:1;border:none;background:${palette.eyebrow};color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.3)`;
        buyNowBtn.addEventListener("mouseenter", () => { buyNowBtn.style.opacity = "0.88"; });
        buyNowBtn.addEventListener("mouseleave", () => { buyNowBtn.style.opacity = "1"; });
        buyNowBtn.addEventListener("click", () => {
          console.log("Buy now clicked. userId:", userId, "defaultVariantId:", product?.defaultVariantId);

          const resolvedVariantId = product?.defaultVariantId;
          if (!resolvedVariantId) {
            // No variant attached — impossible once every product has at least one variant,
            // but guard silently rather than redirecting to a product page that no longer exists.
            console.warn("Buy now: no variant found for product", product?.id);
            return;
          }
          if (!userId) {
            // Return to the exact same URL so the genre + search context is preserved
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
          }

          // ── Close reviews + retract info panel ───────────────────────────
          if (reviewsPanelRef.current) closeReviewsPanel();
          const retractTx = side === "right" ? `translateX(-40px)` : `translateX(40px)`;
          panel.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
          panel.style.opacity = "0";
          panel.style.transform = retractTx;

          setTimeout(() => {
            // Hide info panel — keep it in the DOM so "Back" can restore all event listeners
            panel.style.pointerEvents = "none";
            panel.style.visibility    = "hidden";
            panel.style.transition    = "none";
            hiddenInfoPanelRef.current = panel;
            infoPanelRef.current      = null;

            // ── Build checkout card wrapper ─────────────────────────────────
            const cc = document.createElement("div");
            cc.style.cssText = [
              `position:absolute`,
              `left:${panelLeft}px`,
              `top:${panelTop}px`,
              `min-width:220px`,
              `max-width:${PANEL_MAX_W}px`,
              `max-height:calc(100vh - 40px)`,
              `overflow-y:auto`,
              `background:${palette.bg}`,
              `border:${palette.borderWidth ?? "2px"} solid ${palette.border}`,
              `border-radius:calc(var(--enlarge-radius,12px) + 12px)`,
              `z-index:29`,
              `opacity:0`,
              `transform:translateX(${initTx})`,
              `pointer-events:auto`,
              `box-shadow:${palette.boxShadow ?? "0 24px 64px rgba(0,0,0,0.35)"}`,
              `padding:24px 20px`,
            ].join(";");
            viewerRef.current!.appendChild(cc);
            checkoutPanelRef.current = cc;

            // onBack: retract checkout card, unmount root, restore info panel
            const handleBack = () => {
              const cp = checkoutPanelRef.current; checkoutPanelRef.current = null;
              if (!cp) return;
              if (checkoutRootRef.current) { checkoutRootRef.current.unmount(); checkoutRootRef.current = null; }
              cp.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
              cp.style.opacity = "0"; cp.style.transform = retractTx;
              setTimeout(() => {
                cp.remove();
                const hp = hiddenInfoPanelRef.current; hiddenInfoPanelRef.current = null;
                if (!hp) return;
                hp.style.visibility    = "";
                hp.style.pointerEvents = "";
                hp.style.opacity       = "0";
                hp.style.transform     = `translateX(${initTx})`;
                hp.style.transition    = "none";
                infoPanelRef.current   = hp;
                void hp.getBoundingClientRect();
                hp.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;
                setTimeout(() => { hp.style.opacity = "1"; hp.style.transform = "translateX(0)"; }, 30);
              }, enlargeTransitionMs);
            };

            // ── Mount CheckoutPanel React component ────────────────────────
            if (checkoutRootRef.current) { checkoutRootRef.current.unmount(); checkoutRootRef.current = null; }
            const checkoutRoot = createRoot(cc);
            checkoutRootRef.current = checkoutRoot;
            checkoutRoot.render(createElement(CheckoutPanel, {
              productName:  product.name,
              brandName:    product.brandName,
              categoryName: product.categoryName,
              variantId:    resolvedVariantId,
              unitPrice:    product.priceWithDelta,
              palette,
              onBack:       handleBack,
              userId,
            }));

            // ── Slide checkout card in ─────────────────────────────────────
            void cc.getBoundingClientRect();
            cc.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;
            setTimeout(() => { cc.style.opacity = "1"; cc.style.transform = "translateX(0)"; }, 30);
          }, enlargeTransitionMs);
        });

        // Add to Cart (secondary — outlined) ────────────────────────────
        const cartBtn = document.createElement("button");
        cartBtn.textContent = "Add to cart";
        cartBtn.style.cssText = `${btnShared};flex:1;border:1.5px solid ${palette.border};background:transparent;color:${palette.eyebrow}`;
        cartBtn.addEventListener("mouseenter", () => { cartBtn.style.opacity = "0.75"; });
        cartBtn.addEventListener("mouseleave", () => { cartBtn.style.opacity = "1"; });
        cartBtn.addEventListener("click", async () => {
          if (!product?.defaultVariantId) {
            window.location.href = `/product/${product?.id ?? ""}`;
            return;
          }
          if (!userId) {
            const redir = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?redirect=${redir}`;
            return;
          }
          cartBtn.disabled = true;
          cartBtn.textContent = "Adding…";
          cartBtn.style.opacity = "0.5";
          const result = await addToCart(product.defaultVariantId);
          if (result.message === "not_logged_in") {
            const redir = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?redirect=${redir}`;
            return;
          }
          if (result.ok) notifyCartAdded();
          cartBtn.textContent = result.ok ? "Added ✓" : "Error";
          cartBtn.style.opacity = "1";
          setTimeout(() => { cartBtn.textContent = "Add to cart"; cartBtn.disabled = false; }, 1600);
        });

        // Wishlist (heart icon) ───────────────────────────────────────────
        const wishBtn = document.createElement("button");
        let wishlisted = product?.isWishlisted ?? false;
        wishBtn.innerHTML = wishlisted ? "♥" : "♡";
        wishBtn.style.cssText = `width:38px;height:38px;flex-shrink:0;border-radius:50%;border:1.5px solid ${palette.border};background:transparent;color:${wishlisted ? "#e53e3e" : palette.eyebrow};font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:transform 0.15s ease`;
        wishBtn.title = wishlisted ? "Remove from wishlist" : "Save";
        wishBtn.addEventListener("mouseenter", () => { wishBtn.style.transform = "scale(1.15)"; });
        wishBtn.addEventListener("mouseleave", () => { wishBtn.style.transform = "scale(1)"; });
        wishBtn.addEventListener("click", async () => {
          if (!product) return;
          if (!userId) {
            const redir = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?redirect=${redir}`;
            return;
          }
          wishBtn.style.pointerEvents = "none";
          const result = await toggleWishlist(product.id);
          wishBtn.style.pointerEvents = "";
          if (result.error === "not_logged_in") {
            const redir = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?redirect=${redir}`;
            return;
          }
          wishlisted = result.wishlisted;
          wishBtn.innerHTML = wishlisted ? "♥" : "♡";
          wishBtn.style.color = wishlisted ? "#e53e3e" : palette.eyebrow;
          wishBtn.title = wishlisted ? "Remove from wishlist" : "Save";
        });

        // Row: [♡] [Add to cart] [Buy now]
        const btnsRow = document.createElement("div");
        btnsRow.style.cssText = `display:flex;gap:7px;align-items:stretch;margin-top:2px`;
        btnsRow.appendChild(wishBtn);
        btnsRow.appendChild(cartBtn);
        btnsRow.appendChild(buyNowBtn);
        panel.appendChild(btnsRow);

        // "Hear it" audio player (compact, only when audioUrl exists)
        if (product?.audioUrl) {
          const audioWrap = document.createElement("div");
          audioWrap.style.cssText = `display:flex;align-items:center;gap:8px;margin-top:2px`;

          const audioEl = document.createElement("audio");
          audioEl.src = product.audioUrl;
          audioEl.preload = "none";
          audioEl.style.cssText = `display:none`;
          audioWrap.appendChild(audioEl);

          const playBtn = document.createElement("button");
          playBtn.innerHTML = "&#9654;";
          playBtn.title = "Hear it";
          playBtn.style.cssText = `width:28px;height:28px;border-radius:50%;border:1.5px solid ${palette.border};background:transparent;color:${palette.eyebrow};font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;transition:opacity 0.15s ease`;
          playBtn.addEventListener("mouseenter", () => { playBtn.style.opacity = "0.75"; });
          playBtn.addEventListener("mouseleave", () => { playBtn.style.opacity = "1"; });
          playBtn.addEventListener("click", () => {
            if (audioEl.paused) {
              audioEl.play().catch(() => undefined);
              playBtn.innerHTML = "&#9646;&#9646;";
            } else {
              audioEl.pause();
              playBtn.innerHTML = "&#9654;";
            }
          });
          audioEl.addEventListener("ended", () => { playBtn.innerHTML = "&#9654;"; });

          const hearLabel = document.createElement("span");
          hearLabel.textContent = "Hear it";
          hearLabel.style.cssText = `font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${palette.subtext}`;

          audioWrap.appendChild(playBtn);
          audioWrap.appendChild(hearLabel);
          panel.appendChild(audioWrap);
        }

        // Customize link (below buttons, only when product has options)
        if (product?.hasCustomizations) {
          const custLink = document.createElement("a");
          custLink.textContent = "Customize on product page →";
          custLink.style.cssText = `font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${palette.subtext};cursor:pointer;text-decoration:none;align-self:flex-start;opacity:0.8;transition:opacity 0.15s ease`;
          custLink.addEventListener("mouseenter", () => { custLink.style.opacity = "1"; custLink.style.textDecoration = "underline"; });
          custLink.addEventListener("mouseleave", () => { custLink.style.opacity = "0.8"; custLink.style.textDecoration = "none"; });
          custLink.addEventListener("click", () => { if (product) window.location.href = `/product/${product.id}`; });
          panel.appendChild(custLink);
        }

        // ── Reviews link ───────────────────────────────────────────────────
        // Reviews panel — opposite side from info panel, always available
        const oppSide = side === "right" ? "left" : "right";
        const REV_MAX_W = 320;
        const revLeft = oppSide === "right"
          ? centeredLeft + newRect.width + PAD + 8
          : centeredLeft - PAD - 8 - REV_MAX_W;
        const initRevTx = oppSide === "right"
          ? `-${REV_MAX_W + PAD + 8}px` : `${REV_MAX_W + PAD + 8}px`;

        function buildReviewsPanel() {
          if (!product || reviewsPanelRef.current) return;

          const revPanel = document.createElement("div");
          revPanel.style.cssText = [
            `position:absolute`,
            `left:${revLeft}px`,
            `top:${panelTop}px`,
            `min-width:220px`,
            `max-width:${REV_MAX_W}px`,
            `max-height:calc(100vh - 40px)`,
            `overflow-y:auto`,
            `background:${palette.bg}`,
            `border:${palette.borderWidth ?? "2px"} solid ${palette.border}`,
            `border-radius:calc(var(--enlarge-radius,12px) + 12px)`,
            `z-index:29`,
            `opacity:0`,
            `transform:translateX(${initRevTx})`,
            `pointer-events:auto`,
            `box-shadow:${palette.boxShadow ?? "0 24px 64px rgba(0,0,0,0.35)"}`,
            `padding:24px 20px`,
          ].join(";");

          viewerRef.current!.appendChild(revPanel);
          reviewsPanelRef.current = revPanel;

          // Mount ReviewPanel React component inside the panel wrapper
          if (reviewRootRef.current) { reviewRootRef.current.unmount(); reviewRootRef.current = null; }
          const reviewRoot = createRoot(revPanel);
          reviewRootRef.current = reviewRoot;
          reviewRoot.render(createElement(ReviewPanel, {
            productId: product.id,
            userId: userId ?? null,
            initialReviews: product.reviews as ReviewItem[],
            palette,
          }));

          revPanel.getBoundingClientRect();
          revPanel.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;
          setTimeout(() => {
            revPanel.style.opacity = "1";
            revPanel.style.transform = "translateX(0)";
          }, 60);
        }

        function closeReviewsPanel() {
          const rp = reviewsPanelRef.current;
          if (!rp) return;
          reviewsPanelRef.current = null;
          if (reviewRootRef.current) { reviewRootRef.current.unmount(); reviewRootRef.current = null; }
          const closeTx = oppSide === "right" ? `translateX(-40px)` : `translateX(40px)`;
          rp.style.transition = `opacity ${enlargeTransitionMs}ms ease-in,transform ${enlargeTransitionMs}ms ease-in`;
          rp.style.opacity = "0"; rp.style.transform = closeTx;
          setTimeout(() => rp.remove(), enlargeTransitionMs);
        }

        if (product) {
          const countText = product.reviewCount === 0
            ? "No reviews yet"
            : `${product.reviewCount} review${product.reviewCount !== 1 ? "s" : ""}`;
          const reviewsTrigger = document.createElement("button");
          reviewsTrigger.textContent = countText;
          reviewsTrigger.style.cssText = `background:none;border:none;padding:0;font-size:11px;font-weight:600;color:${palette.subtext};cursor:pointer;text-decoration:underline;text-underline-offset:2px;text-align:left;letter-spacing:0.04em;align-self:flex-start;opacity:0.8;transition:opacity 0.15s ease`;
          reviewsTrigger.addEventListener("mouseenter", () => { reviewsTrigger.style.opacity = "1"; });
          reviewsTrigger.addEventListener("mouseleave", () => { reviewsTrigger.style.opacity = "0.8"; });
          reviewsTrigger.addEventListener("click", () => {
            if (reviewsPanelRef.current) closeReviewsPanel();
            else buildReviewsPanel();
          });
          panel.appendChild(reviewsTrigger);
        }

        viewerRef.current!.appendChild(panel);
        infoPanelRef.current = panel;
        panel.getBoundingClientRect(); // commit initial state
        panel.style.transition = `opacity ${enlargeTransitionMs}ms ease-out,transform ${enlargeTransitionMs}ms ease-out`;

        // stagger: panel slides in 100ms after image; React title mounts at the same moment
        setTimeout(() => {
          if (!panel.parentElement) return;
          panel.style.opacity = "1";
          panel.style.transform = "translateX(0)";

          if (titleAnimation === "echo" && echoSlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(echoSlot);
            echoRootRef.current = root;
            root.render(createElement(EchoText, {
              text: titleText, echoes: 6, lag: 0.3, offset: 14, direction: "right",
              fade: 0.55, blur: 2, tint: palette.divider, mode: "entrance",
              duration: 1400, ease: "ease-in-out",
              fontSize: "clamp(1.2rem,2.5vw,1.8rem)", fontWeight: 600,
              fontFamily: "var(--theme-font-display,serif)", color: palette.eyebrow,
            }));
          }

          if (titleAnimation === "splitflap" && splitflapSlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(splitflapSlot);
            echoRootRef.current = root;
            root.render(createElement(SplitFlapText, {
              text: titleText, flipDuration: 0.16, stagger: 0.05, cycleDelay: 3200,
              charset: "alpha", flipsPerChar: 5, tileColor: palette.border, textColor: palette.eyebrow,
              tileRadius: 4, gap: 4, fontSize: 20, loop: false, padTo: 0,
            }));
          }

          if (titleAnimation === "splitText" && splitTextSlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(splitTextSlot);
            echoRootRef.current = root;
            root.render(createElement(SplitText, {
              text: titleText, tag: "h3", textColor: palette.eyebrow,
              fontFamily: "var(--theme-font-eyebrow,sans-serif)",
              fontSize: "clamp(1rem,2vw,1.4rem)", delay: 70, duration: 0.9,
              ease: "power1.out", splitType: "chars",
              from: { opacity: 0, y: 18 }, to: { opacity: 1, y: 0 },
              threshold: 0.1, rootMargin: "-50px", textAlign: "left",
            }));
          }

          if (titleAnimation === "curvedLoop" && curvedLoopSlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(curvedLoopSlot);
            echoRootRef.current = root;
            root.render(createElement(CurvedLoop, {
              marqueeText: `${titleText.toUpperCase()} ✶`, speed: 0.4, curveAmount: 120,
              direction: "left", interactive: false, textColor: palette.eyebrow,
              fontFamily: "var(--theme-font-eyebrow,serif)", fontSize: 14, letterSpacing: 0.12,
            }));
          }

          if (titleAnimation === "pressure" && pressureSlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(pressureSlot);
            echoRootRef.current = root;
            root.render(createElement(TextPressure, {
              text: titleText.toUpperCase(), fontFamily: "Roboto Flex",
              fontUrl: "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap",
              flex: true, alpha: true, stroke: true, width: true, weight: true,
              italic: false, scale: false, textColor: palette.eyebrow,
              strokeColor: palette.divider, minFontSize: 22,
            }));
          }

          if (titleAnimation === "fuzzy" && fuzzySlot) {
            if (echoRootRef.current) { echoRootRef.current.unmount(); echoRootRef.current = null; }
            const root = createRoot(fuzzySlot);
            echoRootRef.current = root;
            root.render(createElement(FuzzyText, {
              fontSize: "clamp(1.4rem,2.8vw,2rem)", fontWeight: 900,
              fontFamily: "var(--theme-font-eyebrow,sans-serif)", color: palette.eyebrow,
              enableHover: true, baseIntensity: 0.02, hoverIntensity: 0.22, fuzzRange: 6,
              fps: 60, direction: "both", transitionDuration: 6, clickEffect: true,
              glitchMode: true, glitchInterval: 2600, glitchDuration: 120,
              glitchColor: palette.glitchB, letterSpacing: 1,
              children: titleText,
            }));
          }
        }, 100);
      };
      overlay.addEventListener("transitionend", onFirstEnd);
    }
  }, [enlargeTransitionMs, lockScroll, openedImageHeight, openedImageWidth, segments, unlockScroll, onImageClick, cardPalettes, titleAnimation, products, userId]);
  openItemFromElementRef.current = openItemFromElement;

  // ── Tile tap (touch only — mouse clicks handled in mainRef onUp) ──────────
  const onTilePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch" || didMoveRef.current || openingRef.current) return;
    openItemFromElement(e.currentTarget);
  }, [openItemFromElement]);

  useEffect(() => () => { document.body.classList.remove("dg-scroll-lock"); }, []);

  // Open a tile by product ID — used by both the custom event (search bar) and the URL param (deep link)
  const openProductById = useCallback((id: string) => {
    const item = sphereRef.current?.querySelector(`[data-product-id="${CSS.escape(id)}"]`) as HTMLElement | null;
    const tileBtn = item?.querySelector(".item__image") as HTMLElement | null;
    if (tileBtn) openItemFromElementRef.current?.(tileBtn);
  }, []);

  // Listen for search-bar suggestion clicks — no navigation, just open the tile directly
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id) openProductById(id);
    };
    globalThis.addEventListener("dome:open-product", handler);
    return () => globalThis.removeEventListener("dome:open-product", handler);
  }, [openProductById]);


  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      style={{
        ["--segments-x" as string]: segments,
        ["--segments-y" as string]: segments,
        ["--overlay-blur-color" as string]: overlayBlurColor,
        ["--tile-radius" as string]: imageBorderRadius,
        ["--enlarge-radius" as string]: openedImageBorderRadius,
        ["--image-filter" as string]: grayscale ? "grayscale(1)" : "none",
      }}
    >
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-src={it.src}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                data-product-idx={it.productIdx}
                data-product-id={products?.[it.productIdx]?.id ?? ""}
                style={{
                  ["--offset-x" as string]: it.x,
                  ["--offset-y" as string]: it.y,
                  ["--item-size-x" as string]: it.sizeX,
                  ["--item-size-y" as string]: it.sizeY,
                }}
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || "Open image"}
                  onPointerUp={onTilePointerUp}
                >
                  {(() => {
                    const model3dUrl = products?.[it.productIdx]?.model3dUrl;
                    // Only render the 3D thumbnail when there is no real photo.
                    // If both exist, the photo wins for the tile — the 3D is accessed via the slider.
                    const hasRealPhoto = it.src && !it.src.includes("placehold.co");
                    if (model3dUrl && !hasRealPhoto) return <Model3dTile url={model3dUrl} alt={it.alt} />;
                    if (it.src) {
                      return <img src={it.src} draggable={false} alt={it.alt} style={{ objectFit: "cover" }} />;
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim dg-scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
