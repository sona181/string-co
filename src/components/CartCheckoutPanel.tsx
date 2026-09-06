"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { CartItemData } from "@/lib/actions/cart";
import { updateCartItem } from "@/lib/actions/cart";
import { createPaypalOrderForCart, capturePaypalOrderForCart } from "@/app/actions/paypal";

// ── PayPal SDK loader (idempotent — shared with CheckoutPanel) ───────────────
function loadPaypalScript(): Promise<void> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (g["paypal"]) return Promise.resolve();
  const existing = document.querySelector("script[data-pp-sdk]") as HTMLScriptElement | null;
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

type Phase = "checkout" | "capturing" | "confirmed" | "error";

type Props = {
  items: CartItemData[];
  loggedIn?: boolean;
  onBack: () => void;
  onSuccess: () => void;
};

// ── Style tokens (fixed dark palette — lives inside the dark dropdown) ────────
const accent  = "#FF3B1F";
const text    = "#F2EFE4";
const sub     = "#8A8578";
const mono    = "ui-monospace,Menlo,SFMono-Regular,monospace";

function Divider({ thick }: { thick?: boolean }) {
  return (
    <div style={{
      height: thick ? 1.5 : 1,
      background: accent,
      opacity: thick ? 0.7 : 0.22,
      borderRadius: 1,
      margin: "6px 0",
    }} />
  );
}

export default function CartCheckoutPanel({ items: initialItems, loggedIn, onBack, onSuccess }: Props) {
  const [items, setItems] = useState(initialItems);
  const [phase, setPhase] = useState<Phase>("checkout");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [, startTransition] = useTransition();

  const paypalSlotRef   = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  // Load PayPal SDK once on mount (only if logged in)
  useEffect(() => {
    if (!loggedIn) return;
    loadPaypalScript()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, [loggedIn]);

  // Mount PayPal buttons once SDK is ready
  useEffect(() => {
    if (!sdkReady || !paypalSlotRef.current || buttonsRendered.current) return;
    buttonsRendered.current = true;

    type PP = { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => void } };
    const pp = (globalThis as unknown as { paypal: PP }).paypal;

    pp.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 40 },

      createOrder: async () => {
        const r = await createPaypalOrderForCart();
        if (r.error || !r.orderId) throw new Error(r.error ?? "order_failed");
        return r.orderId;
      },

      onApprove: async (data: { orderID: string }) => {
        setPhase("capturing");
        const r = await capturePaypalOrderForCart(data.orderID);
        if (r.error || !r.orderId) {
          setErrorMsg("Payment couldn't be completed — please try again.");
          setPhase("error");
          return;
        }
        setOrderId(r.orderId);
        setPhase("confirmed");
        onSuccess();
      },

      onError: (err: unknown) => {
        console.error("PayPal error:", err);
        setErrorMsg("Payment error — please refresh and try again.");
        setPhase("error");
      },
    }).render(paypalSlotRef.current);
  }, [sdkReady, onSuccess]);

  // ── Derived totals (display only — server always recomputes before charging) ──
  const lineItems = items.map((item) => {
    const unit      = item.variant.product.basePrice + item.variant.priceDelta;
    const lineTotal = unit * item.quantity;
    const combo     = [item.variant.bodyColor.name, item.variant.pickguard.name, item.variant.hardware.name]
      .filter((n) => n !== "Standard").join(" · ");
    return { ...item, unit, lineTotal, combo };
  });
  const subtotal = Math.round(lineItems.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  function handleQty(item: CartItemData, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1 || newQty > 10) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)));
    startTransition(() => updateCartItem(item.id, newQty));
  }

  // ── Confirmed state ──────────────────────────────────────────────────────────
  if (phase === "confirmed" && orderId) {
    const shortId = orderId.slice(-8).toUpperCase();
    return (
      <div style={{ padding: "14px 16px 18px" }}>
        <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: accent }}>
          Order confirmed
        </span>

        <div style={{ fontSize: 40, lineHeight: 1, color: accent, textAlign: "center", margin: "12px 0 8px" }}>✓</div>

        <p style={{ margin: "0 0 12px", fontSize: 12, color: text, textAlign: "center" }}>
          Order <strong>#{shortId}</strong>
        </p>

        <Divider thick />

        <div style={{ fontFamily: mono, display: "flex", flexDirection: "column", gap: 4, margin: "6px 0" }}>
          {lineItems.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8, opacity: 0.85 }}>
                {l.quantity} × {l.variant.product.name}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmt.format(l.lineTotal)}</span>
            </div>
          ))}
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text, opacity: 0.75 }}>
            <span>Tax (8%)</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(tax)}</span>
          </div>
          <Divider thick />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 900, color: text }}>
            <span>Total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(total)}</span>
          </div>
        </div>

        <a
          href={`/account/orders/${orderId}`}
          style={{ display: "block", fontSize: 11, fontWeight: 700, color: accent, textDecoration: "none", textAlign: "center", marginTop: 14 }}
        >
          View order →
        </a>
      </div>
    );
  }

  // ── Main checkout state ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: "14px 16px 18px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: accent }}>
          Checkout
        </span>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 700, color: sub, cursor: "pointer", letterSpacing: "0.04em" }}
        >
          ← Back
        </button>
      </div>

      <Divider thick />

      {/* Per-item rows with qty steppers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0" }}>
        {lineItems.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Name + combo */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: text, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {l.variant.product.name}
              </div>
              {l.combo && (
                <div style={{ fontSize: 10, color: sub, marginTop: 1 }}>{l.combo}</div>
              )}
            </div>

            {/* Qty stepper */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, overflow: "hidden", fontSize: 11, flexShrink: 0 }}>
              <button
                onClick={() => handleQty(l, -1)}
                disabled={l.quantity <= 1}
                style={{ padding: "3px 8px", background: "none", border: "none", cursor: "pointer", color: sub, lineHeight: 1, opacity: l.quantity <= 1 ? 0.35 : 1 }}
              >
                −
              </button>
              <span style={{ padding: "3px 4px", color: text, fontWeight: 700, minWidth: 18, textAlign: "center" }}>
                {l.quantity}
              </span>
              <button
                onClick={() => handleQty(l, 1)}
                disabled={l.quantity >= 10}
                style={{ padding: "3px 8px", background: "none", border: "none", cursor: "pointer", color: sub, lineHeight: 1, opacity: l.quantity >= 10 ? 0.35 : 1 }}
              >
                +
              </button>
            </div>

            {/* Line total */}
            <span style={{ fontSize: 11, fontWeight: 800, color: text, flexShrink: 0, minWidth: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {fmt.format(l.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals receipt */}
      <div style={{ fontFamily: mono }}>
        <Divider />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text, opacity: 0.75 }}>
            <span>Subtotal</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text, opacity: 0.75 }}>
            <span>Shipping</span>
            <span>{fmt.format(0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text, opacity: 0.75 }}>
            <span>Tax (est. 8%)</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(tax)}</span>
          </div>
        </div>
        <Divider thick />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 900, color: text }}>
          <span>Total</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt.format(total)}</span>
        </div>
      </div>

      {/* PayPal slot or sign-in prompt */}
      <div style={{ marginTop: 12 }}>
        {!loggedIn ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            padding: "12px", border: "1.5px solid rgba(255,59,31,0.4)",
            borderRadius: 10, background: "rgba(255,59,31,0.05)",
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: text, textAlign: "center" }}>
              Sign in to complete your purchase
            </p>
            <a
              href={"/login?redirect=" + encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/")}
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "9px 0", background: accent, color: "#fff",
                borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: "none",
              }}
            >
              Sign in
            </a>
          </div>
        ) : (
          <>
            {sdkError && (
              <p style={{ fontSize: 11, color: "#e53e3e", margin: "0 0 6px", textAlign: "center" }}>
                Could not load PayPal. Please refresh and try again.
              </p>
            )}
            {!sdkReady && !sdkError && (
              <p style={{ fontSize: 11, color: sub, margin: "0 0 6px", textAlign: "center", opacity: 0.7 }}>
                Loading payment…
              </p>
            )}
            {phase === "capturing" && (
              <p style={{ fontSize: 11, color: sub, margin: "0 0 6px", textAlign: "center", opacity: 0.7 }}>
                Completing payment…
              </p>
            )}
            {phase === "error" && errorMsg && (
              <p style={{ fontSize: 11, color: "#e53e3e", margin: "0 0 6px", textAlign: "center" }}>
                {errorMsg}
              </p>
            )}
            <div
              ref={paypalSlotRef}
              style={{
                minHeight: sdkReady && phase === "checkout" ? 48 : 0,
                display:   sdkReady && phase === "checkout" ? "block" : "none",
              }}
            />
          </>
        )}
      </div>

      <p style={{ fontSize: 10, color: sub, margin: "8px 0 0", textAlign: "center", opacity: 0.6 }}>
        🔒 Secure payment via PayPal
      </p>
    </div>
  );
}
