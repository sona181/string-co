"use client";

import { useState, useEffect, useRef } from "react";
import type { CardPalette } from "@/lib/themes";
import { createPaypalOrder, capturePaypalOrder } from "@/app/actions/paypal";

// ── PayPal SDK loader (idempotent) ───────────────────────────────────────────
function loadPaypalScript(): Promise<void> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (g["paypal"]) return Promise.resolve();
  const existing = document.querySelector('script[data-pp-sdk]') as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load",  () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PayPal SDK load error")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "test";
    const script = document.createElement("script");
    script.dataset.ppSdk = "1";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&components=buttons`;
    script.addEventListener("load",  () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("PayPal SDK load error")), { once: true });
    document.head.appendChild(script);
  });
}

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  productName:   string;
  brandName:     string;
  categoryName:  string;
  comboLabel?:   string;   // "Cherry red / Black / Chrome" — omit if no variant combo
  variantId:     string;
  unitPrice:     number;
  palette:       CardPalette;
  onBack:        () => void;
  userId?:       string | null;  // null → show sign-in prompt instead of PayPal buttons
};

// ── Receipt row ──────────────────────────────────────────────────────────────
function Row({ label, value, bold, palette }: { label: string; value: number; bold?: boolean; palette: CardPalette }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 6,
      fontSize: bold ? 13 : 11,
      fontWeight: bold ? 900 : 400,
      color: palette.text,
      opacity: bold ? 1 : 0.85,
    }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(value)}</span>
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Div({ palette, thick }: { palette: CardPalette; thick?: boolean }) {
  return (
    <div style={{
      height: thick ? 1.5 : 1,
      background: palette.divider,
      opacity: thick ? 1 : 0.35,
      borderRadius: 1,
      margin: "2px 0",
    }} />
  );
}

// ── Component ────────────────────────────────────────────────────────────────
type Phase = "checkout" | "capturing" | "confirmed" | "error";

export default function CheckoutPanel({
  productName, brandName, categoryName, comboLabel,
  variantId, unitPrice, palette, onBack, userId,
}: Props) {
  const [qty,       setQty]       = useState(1);
  const [phase,     setPhase]     = useState<Phase>("checkout");
  const [orderId,   setOrderId]   = useState<string | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [sdkReady,  setSdkReady]  = useState(false);
  const [sdkError,  setSdkError]  = useState(false);

  // qtyRef lets PayPal closures always read the latest qty without re-mounting buttons
  const qtyRef       = useRef(qty);
  const paypalSlotRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  useEffect(() => { qtyRef.current = qty; }, [qty]);

  // Load PayPal SDK once on mount — skip if user is not authenticated
  useEffect(() => {
    if (!userId) return;
    loadPaypalScript()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, [userId]);

  // Mount PayPal buttons once SDK is ready and the slot is in the DOM
  useEffect(() => {
    if (!sdkReady || !paypalSlotRef.current || buttonsRendered.current) return;
    buttonsRendered.current = true;

    type PP = { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => void } };
    const pp = (globalThis as unknown as { paypal: PP }).paypal;

    pp.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 40 },

      createOrder: async () => {
        const r = await createPaypalOrder(variantId, qtyRef.current);
        if (r.error || !r.orderId) throw new Error(r.error ?? "order_failed");
        return r.orderId;
      },

      onApprove: async (data: { orderID: string }) => {
        setPhase("capturing");
        const r = await capturePaypalOrder(data.orderID, variantId, qtyRef.current);
        if (r.error || !r.orderId) {
          setErrorMsg("Payment couldn't be completed — please try again.");
          setPhase("error");
          return;
        }
        setOrderId(r.orderId);
        setPhase("confirmed");
      },

      onError: (err: unknown) => {
        console.error("PayPal error:", err);
        setErrorMsg("Payment error — please refresh and try again.");
        setPhase("error");
      },
    }).render(paypalSlotRef.current);
  }, [sdkReady, variantId]);

  // ── Derived totals (display only — server always recomputes before charging) ──
  const subtotal = Math.round(unitPrice * qty * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  // ── Shared style helpers ─────────────────────────────────────────────────────
  const eyebrowStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.18em", color: palette.eyebrow,
  };
  const subStyle: React.CSSProperties = {
    fontSize: 10, color: palette.subtext, margin: 0,
  };
  const monoWrap: React.CSSProperties = {
    fontFamily: "ui-monospace,Menlo,SFMono-Regular,monospace",
    display: "flex", flexDirection: "column", gap: 3,
  };
  const qtyBtnStyle: React.CSSProperties = {
    width: 26, height: 26, borderRadius: "50%",
    border: `1.5px solid ${palette.border}`,
    background: "transparent", color: palette.text,
    fontSize: 15, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, lineHeight: 1,
  };

  // ── Confirmation phase ───────────────────────────────────────────────────────
  if (phase === "confirmed" && orderId) {
    const shortId = orderId.slice(-8).toUpperCase();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={eyebrowStyle}>Order confirmed</span>

        <div style={{ fontSize: 44, lineHeight: 1, color: palette.eyebrow, textAlign: "center" }}>✓</div>

        <p style={{ margin: 0, fontSize: 12, color: palette.text, textAlign: "center" }}>
          Order <strong>#{shortId}</strong>
        </p>

        <div style={{ ...monoWrap, borderTop: `1.5px solid ${palette.border}`, borderBottom: `1.5px solid ${palette.border}`, padding: "10px 0" }}>
          <Row label={`${qty} × ${fmt.format(unitPrice)}`} value={subtotal} palette={palette} />
          <Row label="Shipping" value={0} palette={palette} />
          <Row label="Tax (est. 8%)" value={tax} palette={palette} />
          <Div palette={palette} thick />
          <Row label="Total" value={total} bold palette={palette} />
        </div>

        <a
          href={`/account/orders/${orderId}`}
          style={{ fontSize: 11, fontWeight: 700, color: palette.eyebrow, textDecoration: "none", textAlign: "center", display: "block" }}
        >
          View order →
        </a>

        <button
          onClick={() => {
            // Close the whole panel by simulating a scrim click
            const scrim = document.querySelector(".dg-scrim") as HTMLElement | null;
            scrim?.click();
          }}
          style={{
            width: "100%", height: 38, borderRadius: 10,
            border: `1.5px solid ${palette.border}`,
            background: "transparent", color: palette.text,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          Continue shopping
        </button>
      </div>
    );
  }

  // ── Main checkout phase ──────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={eyebrowStyle}>Checkout</span>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 700, color: palette.subtext, cursor: "pointer", letterSpacing: "0.04em", opacity: 0.8 }}
        >
          ← Back
        </button>
      </div>

      <Div palette={palette} thick />

      {/* Product name + combo */}
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: palette.text }}>{productName}</p>
        {comboLabel && (
          <p style={{ ...subStyle, marginTop: 2 }}>{comboLabel}</p>
        )}
        <p style={{ ...subStyle, marginTop: 2 }}>{brandName} · {categoryName}</p>
      </div>

      {/* Quantity stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: palette.subtext, textTransform: "uppercase", letterSpacing: "0.08em", flex: 1 }}>
          Qty
        </span>
        <button
          style={qtyBtnStyle}
          onClick={() => setQty(q => Math.max(1, q - 1))}
          disabled={qty <= 1}
        >
          −
        </button>
        <span style={{ fontSize: 14, fontWeight: 800, color: palette.text, minWidth: 20, textAlign: "center" }}>
          {qty}
        </span>
        <button
          style={qtyBtnStyle}
          onClick={() => setQty(q => Math.min(10, q + 1))}
          disabled={qty >= 10}
        >
          +
        </button>
      </div>

      {/* Receipt — live-updating with qty */}
      <div style={monoWrap}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: palette.subtext, display: "flex", justifyContent: "space-between", marginBottom: 2, opacity: 0.7 }}>
          <span>Item</span>
          <span>Cost</span>
        </div>
        <Div palette={palette} />
        <Row label={`${productName}`} value={subtotal} palette={palette} />
        <Div palette={palette} />
        <Row label="Shipping" value={0} palette={palette} />
        <Row label="Tax (est. 8%)" value={tax} palette={palette} />
        <Div palette={palette} thick />
        <Row label="Subtotal" value={subtotal} palette={palette} />
        <Row label="Total" value={total} bold palette={palette} />
      </div>

      {/* PayPal slot / sign-in prompt */}
      <div>
        {!userId ? (
          /* Unauthenticated — show sign-in CTA instead of payment buttons */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            padding: "14px 12px",
            border: `1.5px solid ${palette.border}`,
            borderRadius: 12,
            background: "rgba(255,59,31,0.05)",
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: palette.text, textAlign: "center" }}>
              Sign in to complete your purchase
            </p>
            <p style={{ margin: 0, fontSize: 10, color: palette.subtext, textAlign: "center" }}>
              Your cart selection is saved — just log in and come right back.
            </p>
            <a
              href={`/login?redirect=${encodeURIComponent(globalThis.location?.href ?? "/")}`}
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "10px 0",
                background: palette.eyebrow, color: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 800,
                textDecoration: "none", letterSpacing: "0.04em",
              }}
            >
              Sign in
            </a>
          </div>
        ) : (
          <>
            {sdkError && (
              <p style={{ fontSize: 11, color: "#e53e3e", margin: 0, textAlign: "center" }}>
                Could not load PayPal. Please refresh and try again.
              </p>
            )}
            {!sdkReady && !sdkError && (
              <p style={{ fontSize: 11, color: palette.subtext, margin: 0, textAlign: "center", opacity: 0.7 }}>
                Loading payment…
              </p>
            )}
            {phase === "capturing" && (
              <p style={{ fontSize: 11, color: palette.subtext, margin: 0, textAlign: "center", opacity: 0.7 }}>
                Completing payment…
              </p>
            )}
            {phase === "error" && errorMsg && (
              <p style={{ fontSize: 11, color: "#e53e3e", margin: 0, textAlign: "center" }}>
                {errorMsg}
              </p>
            )}
            {/* Slot always in DOM so PayPal can render into it — hidden when not needed */}
            <div
              ref={paypalSlotRef}
              style={{
                minHeight: sdkReady && phase === "checkout" ? 48 : 0,
                display: sdkReady && phase === "checkout" ? "block" : "none",
              }}
            />
          </>
        )}
      </div>

      {/* Fine print */}
      <p style={{ fontSize: 10, color: palette.subtext, margin: 0, textAlign: "center", opacity: 0.65 }}>
        🔒 Secure payment via PayPal
      </p>
    </div>
  );
}
