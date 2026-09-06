"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShoppingCart, Zap, ChevronLeft, ChevronRight, X } from "lucide-react";
import { addToCart } from "@/lib/actions/cart";
import { notifyCartAdded } from "@/lib/cartStore";
import clsx from "clsx";
import ModelViewer from "@/components/ModelViewer";
import CheckoutPanel from "@/components/CheckoutPanel";
import type { CardPalette } from "@/lib/themes";

// Default palette for the product-page checkout modal (no genre theme here)
const PRODUCT_PAGE_PALETTE: CardPalette = {
  bg:          "#0D0D0D",
  text:        "#F2EFE4",
  subtext:     "#8A8578",
  eyebrow:     "#FF3B1F",
  divider:     "#F7D726",
  border:      "#FF3B1F",
  glitchA:     "#FF3B1F",
  glitchB:     "#00C2A8",
};

type Option = { id: string; name: string; hexOrValue: string | null };
type Variant = {
  id: string;
  comboKey: string;
  imageUrl: string;
  priceDelta: number;
  bodyColorOptionId: string;
  pickguardOptionId: string;
  hardwareOptionId: string;
};

type Props = {
  product: { id: string; name: string; brandName: string; categoryName: string; basePrice: number; description: string };
  defaultVariant: Variant | null;
  variants: Variant[];
  bodyColors: Option[];
  pickguards: Option[];
  hardwareOptions: Option[];
  productImageUrl?: string | null;
  model3dUrl?: string | null;
  userId?: string | null;
};

type Tab = "Body Finish" | "Pickguard" | "Hardware";
const TABS: Tab[] = ["Body Finish", "Pickguard", "Hardware"];

type Slide = { type: "photo"; src: string } | { type: "3d"; url: string };

export default function ProductCustomizer({
  product, defaultVariant, variants, bodyColors, pickguards, hardwareOptions,
  productImageUrl, model3dUrl, userId,
}: Props) {
  const [selectedColor, setSelectedColor]       = useState(defaultVariant?.bodyColorOptionId ?? bodyColors[0]?.id);
  const [selectedPickguard, setSelectedPickguard] = useState(defaultVariant?.pickguardOptionId ?? pickguards[0]?.id);
  const [selectedHardware, setSelectedHardware]  = useState(defaultVariant?.hardwareOptionId ?? hardwareOptions[0]?.id);
  const [activeTab, setActiveTab]               = useState<Tab>("Body Finish");
  const [slideIdx, setSlideIdx]                 = useState(0);
  const [quantity, setQuantity]                 = useState(1);
  const [pending, startTransition]              = useTransition();
  const [showCheckout, setShowCheckout]         = useState(false);

  const matchedVariant = variants.find(
    (v) =>
      v.bodyColorOptionId === selectedColor &&
      v.pickguardOptionId === selectedPickguard &&
      v.hardwareOptionId === selectedHardware,
  ) ?? defaultVariant;

  const displayPrice = Number(product.basePrice) + Number(matchedVariant?.priceDelta ?? 0);

  // Photo: prefer variant image, then product-level image, then placeholder
  const photoSrc =
    matchedVariant?.imageUrl ||
    productImageUrl ||
    `https://placehold.co/800x600/e5e7eb/9ca3af?text=${encodeURIComponent(product.name)}`;

  // Build slide list: photo first, 3D last
  const slides: Slide[] = [
    { type: "photo", src: photoSrc },
    ...(model3dUrl ? [{ type: "3d" as const, url: model3dUrl }] : []),
  ];

  const canPrev = slideIdx > 0;
  const canNext = slideIdx < slides.length - 1;
  const go = (idx: number) => setSlideIdx(Math.max(0, Math.min(slides.length - 1, idx)));

  function handleAddToCart() {
    if (!matchedVariant) return;
    startTransition(async () => {
      const result = await addToCart(matchedVariant.id, quantity);
      if (!result?.error) notifyCartAdded();
    });
  }

  function handleBuyNow() {
    if (!matchedVariant) return;
    setShowCheckout(true);
  }

  const tabOptions: Record<Tab, { options: Option[]; selected: string; set: (id: string) => void }> = {
    "Body Finish": { options: bodyColors,       selected: selectedColor,      set: setSelectedColor      },
    "Pickguard":   { options: pickguards,        selected: selectedPickguard,  set: setSelectedPickguard  },
    "Hardware":    { options: hardwareOptions,   selected: selectedHardware,   set: setSelectedHardware   },
  };

  const colorName = bodyColors.find((c) => c.id === selectedColor)?.name;
  const pgName    = pickguards.find((p) => p.id === selectedPickguard)?.name;
  const hwName    = hardwareOptions.find((h) => h.id === selectedHardware)?.name;

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

      {/* ── Media carousel ─────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="relative rounded-2xl overflow-hidden bg-gray-50" style={{ height: 420 }}>

          {/* Slide strip — translates horizontally */}
          <div
            className="flex h-full"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(${-slideIdx * (100 / slides.length)}%)`,
              transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {slides.map((slide, i) => (
              <div
                key={i}
                style={{ width: `${100 / slides.length}%`, flexShrink: 0, height: "100%" }}
              >
                {slide.type === "photo" ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={slide.src}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={i === 0}
                    />
                  </div>
                ) : (
                  <ModelViewer
                    url={slide.url}
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Left arrow */}
          {canPrev && (
            <button
              onClick={() => go(slideIdx - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
          )}

          {/* Right arrow */}
          {canNext && (
            <button
              onClick={() => go(slideIdx + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors z-10"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          )}

          {/* 3D badge on the 3D slide */}
          {slides[slideIdx]?.type === "3d" && (
            <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
              ⟳ 3D · drag to rotate
            </div>
          )}
        </div>

        {/* Dot indicators — only when more than one slide */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={s.type === "3d" ? "3D model" : `Photo ${i + 1}`}
                className={clsx(
                  "rounded-full transition-all duration-200",
                  i === slideIdx
                    ? "w-5 h-2 bg-gray-800"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Info panel ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            {(matchedVariant?.priceDelta ?? 0) > 0 && (
              <span className="text-sm font-normal text-amber-600 ml-2">
                +${Number(matchedVariant!.priceDelta).toFixed(2)} for this finish
              </span>
            )}
          </p>
          {matchedVariant && (
            <p className="text-xs text-gray-400 mt-1">{colorName} · {pgName} · {hwName}</p>
          )}
          {!matchedVariant && bodyColors.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">This combination isn&apos;t available — try a different option.</p>
          )}
        </div>

        {/* Customizer swatches */}
        {bodyColors.length > 0 && (
          <div className="border border-gray-100 rounded-2xl p-4">
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors",
                    activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {tabOptions[activeTab].options.map((opt) => {
                const isSelected = tabOptions[activeTab].selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => tabOptions[activeTab].set(opt.id)}
                    title={opt.name}
                    className={clsx(
                      "group flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-xs",
                      isSelected ? "border-amber-400 bg-amber-50" : "border-transparent hover:border-gray-200",
                    )}
                  >
                    {opt.hexOrValue ? (
                      <span className="w-8 h-8 rounded-full border border-gray-200 block" style={{ backgroundColor: opt.hexOrValue }} />
                    ) : (
                      <span className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">∅</span>
                    )}
                    <span className={clsx("font-medium", isSelected ? "text-amber-700" : "text-gray-500")}>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity + CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg leading-none">−</button>
            <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg leading-none">+</button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={pending || !matchedVariant}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-xl py-3 text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            {pending ? "Adding…" : "Add to cart"}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={!matchedVariant}
            className="flex items-center gap-2 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Zap className="w-4 h-4" /> Buy now
          </button>
        </div>
      </div>
    </div>

    {/* ── Checkout modal ──────────────────────────────────────────────────── */}
    {showCheckout && matchedVariant && (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) setShowCheckout(false); }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <div style={{
          width: "100%", maxWidth: 360,
          background: PRODUCT_PAGE_PALETTE.bg,
          border: `1.5px solid ${PRODUCT_PAGE_PALETTE.border}`,
          borderRadius: 24,
          padding: "24px 20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(255,59,31,0.15)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
          <button
            onClick={() => setShowCheckout(false)}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "none", border: "none", cursor: "pointer",
              color: PRODUCT_PAGE_PALETTE.subtext, fontSize: 18, lineHeight: 1,
              padding: 4,
            }}
            aria-label="Close"
          >
            ✕
          </button>

          <CheckoutPanel
            productName={product.name}
            brandName={product.brandName}
            categoryName={product.categoryName}
            comboLabel={[colorName, pgName, hwName].filter(Boolean).join(" / ") || undefined}
            variantId={matchedVariant.id}
            unitPrice={displayPrice}
            palette={PRODUCT_PAGE_PALETTE}
            onBack={() => setShowCheckout(false)}
            userId={userId}
          />
        </div>
      </div>
    )}
    </>
  );
}
