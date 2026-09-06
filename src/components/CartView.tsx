"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import CartItemRow from "@/components/CartItemRow";
import CartCheckoutPanel from "@/components/CartCheckoutPanel";
import type { CartItemData } from "@/lib/actions/cart";

// ── Fixed dark palette (cart page is not genre-driven) ────────────────────────
const RED  = "#FF3B1F";
const TEXT = "#F2EFE4";
const SUB  = "#8A8578";
const MONO = "ui-monospace,Menlo,SFMono-Regular,monospace";

// Font vars set by the server component in themeVars
const EYEBROW_FONT = "var(--theme-font-eyebrow, sans-serif)";
const DISPLAY_FONT = "var(--theme-font-display, sans-serif)";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type Props = {
  items: CartItemData[];
  loggedIn: boolean;
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "rgba(14,10,9,0.82)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,59,31,0.28)",
  borderRadius: 20,
  padding: "34px 32px 36px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.4)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: RED,
  margin: "0 0 28px",
  fontFamily: EYEBROW_FONT,
};

const divider = (
  <div style={{ height: 1, background: RED, opacity: 0.28, margin: "16px 0" }} />
);

export default function CartView({ items, loggedIn }: Props) {
  const [view, setView] = useState<"cart" | "checkout">("cart");

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.variant.product.basePrice + item.variant.priceDelta) * item.quantity,
    0,
  );

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (items.length === 0 && view === "cart") {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "8px 0" }}>
          <ShoppingBag style={{ width: 44, height: 44, color: SUB, opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: DISPLAY_FONT }}>
            Your cart is empty
          </p>
          <p style={{ margin: 0, fontSize: 13, color: SUB }}>
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/shop"
            className="hover:brightness-110 active:brightness-90 transition-all duration-150"
            style={{
              display: "inline-block", marginTop: 4,
              background: RED, color: "#fff",
              borderRadius: 10, padding: "11px 28px",
              fontSize: 12, fontWeight: 800,
              textDecoration: "none",
              textTransform: "uppercase", letterSpacing: "0.08em",
              fontFamily: EYEBROW_FONT,
            }}
          >
            Browse guitars
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout view ────────────────────────────────────────────────────────────
  if (view === "checkout") {
    return (
      <div style={cardStyle}>
        <CartCheckoutPanel
          items={items}
          loggedIn={loggedIn}
          onBack={() => setView("cart")}
          onSuccess={() => {
            // CartCheckoutPanel shows its own confirmed state;
            // server revalidation will clear the cart on next navigation
          }}
        />
      </div>
    );
  }

  // ── Cart view ────────────────────────────────────────────────────────────────
  return (
    <div style={cardStyle}>
      <p style={eyebrowStyle}>Your cart</p>

      {/* Item rows */}
      <div>
        {items.map((item, i) => (
          <div key={item.id}>
            {i > 0 && divider}
            <CartItemRow item={item} />
          </div>
        ))}
      </div>

      {/* Receipt */}
      <div style={{ marginTop: 32 }}>
        <div style={{ height: 1.5, background: RED, opacity: 0.35, marginBottom: 18 }} />
        <div style={{ fontFamily: MONO, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: SUB, fontFamily: EYEBROW_FONT,
            }}>
              Subtotal&nbsp;({items.length}&nbsp;item{items.length !== 1 ? "s" : ""})
            </span>
            <span style={{ fontSize: 13, color: TEXT, fontVariantNumeric: "tabular-nums" }}>
              {fmt.format(subtotal)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: SUB, fontFamily: EYEBROW_FONT,
            }}>
              Shipping
            </span>
            <span style={{ fontSize: 13, color: SUB, fontVariantNumeric: "tabular-nums" }}>
              Free
            </span>
          </div>
          <div style={{ height: 1, background: RED, opacity: 0.25 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{
              fontSize: 10, fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.1em", color: TEXT, fontFamily: EYEBROW_FONT,
            }}>
              Total
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: TEXT, fontVariantNumeric: "tabular-nums", fontFamily: DISPLAY_FONT }}>
              {fmt.format(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => setView("checkout")}
          className="hover:brightness-110 active:brightness-90 transition-all duration-150"
          style={{
            display: "block", width: "100%", textAlign: "center",
            background: RED, color: "#fff",
            borderRadius: 12, padding: "14px 0",
            fontSize: 12, fontWeight: 900,
            border: "none", cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.1em",
            fontFamily: EYEBROW_FONT,
          }}
        >
          Proceed to checkout
        </button>
        <Link
          href="/shop"
          style={{ fontSize: 12, color: SUB, textDecoration: "none", letterSpacing: "0.04em" }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
