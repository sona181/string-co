"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X, ShoppingBag } from "lucide-react";
import { getCartItems, updateCartItem, removeCartItem } from "@/lib/actions/cart";
import type { CartItemData } from "@/lib/actions/cart";
import { useCartCount } from "@/lib/cartStore";
import CartCheckoutPanel from "@/components/CartCheckoutPanel";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type Props = {
  readonly loggedIn?: boolean;
};

export default function CartDropdown({ loggedIn }: Props) {
  const { count, setCount } = useCartCount();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"cart" | "checkout">("cart");
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce(
    (s, item) => s + (item.variant.product.basePrice + item.variant.priceDelta) * item.quantity,
    0,
  );

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCartItems();
      setItems(data.items);
      setCount(data.items.length);
    } finally {
      setLoading(false);
    }
  }, [setCount]);

  // Fetch when panel opens; reset to cart view when it closes
  useEffect(() => {
    if (open) {
      fetchCart();
    } else {
      setView("cart");
    }
  }, [open, fetchCart]);

  // Refetch if an item is added while the panel is open
  useEffect(() => {
    const handler = () => { if (open) fetchCart(); };
    window.addEventListener("cart:item-added", handler);
    return () => window.removeEventListener("cart:item-added", handler);
  }, [open, fetchCart]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function handleQty(item: CartItemData, delta: number) {
    const newQty = item.quantity + delta;
    setItems((prev) =>
      newQty <= 0
        ? prev.filter((i) => i.id !== item.id)
        : prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
    );
    if (newQty <= 0) setCount((c) => Math.max(0, c - 1));
    startTransition(() => updateCartItem(item.id, newQty));
  }

  function handleRemove(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setCount((c) => Math.max(0, c - 1));
    startTransition(() => removeCartItem(itemId));
  }

  // Fallback palette — CSS vars resolve on /shop with active theme
  const accent = "var(--theme-accent, #FF3B1F)";
  const bg     = "var(--theme-card-bg, #181818)";
  const text   = "var(--theme-card-text, #F2EFE4)";
  const sub    = "var(--theme-panel-subtext, #8A8578)";
  const divClr = "var(--theme-accent, #FF3B1F)";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle cart"
        aria-expanded={open}
        className="relative p-2 text-rust-gray hover:text-concrete transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white rounded-full flex items-center justify-center font-bold"
            style={{ background: accent, fontSize: 9, width: 16, height: 16 }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 520,
            overflowY: "auto",
            background: bg,
            border: `1.5px solid ${divClr}`,
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,59,31,0.06)",
            zIndex: 10000,
          }}
        >
          {/* ── Checkout view ─────────────────────────────────────────────── */}
          {view === "checkout" ? (
            <CartCheckoutPanel
              items={items}
              loggedIn={loggedIn}
              onBack={() => setView("cart")}
              onSuccess={() => { setItems([]); setCount(0); }}
            />
          ) : (
            <>
              {/* ── Cart view header ─────────────────────────────────────── */}
              <div style={{ padding: "14px 16px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                    letterSpacing: "0.18em", color: accent,
                  }}>
                    Your cart
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: sub, padding: 2, lineHeight: 1 }}
                    aria-label="Close cart"
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
                <div style={{ height: 1, background: divClr, opacity: 0.22, margin: "10px 0 0" }} />
              </div>

              {/* ── Body ─────────────────────────────────────────────────── */}
              {loading ? (
                <div style={{ padding: 28, textAlign: "center", color: sub, fontSize: 12 }}>Loading…</div>
              ) : items.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center" }}>
                  <ShoppingBag style={{ width: 38, height: 38, color: sub, margin: "0 auto 10px", opacity: 0.5 }} />
                  <p style={{ color: sub, fontSize: 13, margin: "0 0 16px" }}>Your cart is empty</p>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "inline-block",
                      background: accent, color: "#fff",
                      borderRadius: 8, padding: "8px 22px",
                      fontSize: 12, fontWeight: 800,
                      textDecoration: "none", letterSpacing: "0.06em",
                    }}
                  >
                    Browse guitars
                  </Link>
                </div>
              ) : (
                <>
                  {/* Item list */}
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {items.map((item) => {
                      const unitPrice = item.variant.product.basePrice + item.variant.priceDelta;
                      const combo = [
                        item.variant.bodyColor.name,
                        item.variant.pickguard.name,
                        item.variant.hardware.name,
                      ].filter((n) => n !== "Standard").join(" · ");

                      return (
                        <div key={item.id} style={{ display: "flex", gap: 10 }}>
                          {/* Thumbnail */}
                          <Link
                            href={`/product/${item.variant.product.id}`}
                            onClick={() => setOpen(false)}
                            style={{ flexShrink: 0 }}
                          >
                            <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "#2a2a2a", position: "relative" }}>
                              {item.variant.imageUrl ? (
                                <Image
                                  src={item.variant.imageUrl}
                                  alt={item.variant.product.name}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  sizes="52px"
                                />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                  🎸
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                              <Link
                                href={`/product/${item.variant.product.id}`}
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, fontWeight: 700, color: text, textDecoration: "none", lineHeight: 1.3 }}
                              >
                                {item.variant.product.name}
                              </Link>
                              <button
                                onClick={() => handleRemove(item.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: sub, padding: 0, flexShrink: 0, lineHeight: 1 }}
                                aria-label="Remove item"
                              >
                                <X style={{ width: 12, height: 12 }} />
                              </button>
                            </div>

                            {combo && (
                              <p style={{ fontSize: 10, color: sub, margin: "2px 0 0", lineHeight: 1.3 }}>{combo}</p>
                            )}

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                              {/* Qty stepper */}
                              <div style={{
                                display: "flex", alignItems: "center",
                                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
                                overflow: "hidden", fontSize: 11,
                              }}>
                                <button
                                  onClick={() => handleQty(item, -1)}
                                  style={{ padding: "3px 9px", background: "none", border: "none", cursor: "pointer", color: sub, lineHeight: 1 }}
                                >
                                  −
                                </button>
                                <span style={{ padding: "3px 6px", color: text, fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQty(item, 1)}
                                  style={{ padding: "3px 9px", background: "none", border: "none", cursor: "pointer", color: sub, lineHeight: 1 }}
                                >
                                  +
                                </button>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: text }}>
                                {fmt.format(unitPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal + CTAs */}
                  <div style={{ padding: "0 16px 16px" }}>
                    <div style={{ height: 1, background: divClr, opacity: 0.22, margin: "0 0 12px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                      <span style={{ fontSize: 10, color: sub, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                        Subtotal
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: text }}>{fmt.format(subtotal)}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href="/cart"
                        onClick={() => setOpen(false)}
                        style={{
                          flex: 1, textAlign: "center", padding: "10px 0",
                          border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 10,
                          fontSize: 11, fontWeight: 800, color: text,
                          textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em",
                        }}
                      >
                        View cart
                      </Link>
                      <button
                        onClick={() => setView("checkout")}
                        style={{
                          flex: 1, textAlign: "center", padding: "10px 0",
                          background: accent, borderRadius: 10,
                          fontSize: 11, fontWeight: 800, color: "#fff",
                          border: "none", cursor: "pointer",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
