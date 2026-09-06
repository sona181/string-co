"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";
import { useTransition } from "react";
import type { CSSProperties } from "react";

type Item = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    priceDelta: number;
    imageUrl: string;
    bodyColor: { name: string };
    pickguard: { name: string };
    hardware: { name: string };
    product: {
      id: string;
      name: string;
      basePrice: number;
      brand: { name: string };
    };
  };
};

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CartItemRow({ item }: { readonly item: Item }) {
  const [pending, startTransition] = useTransition();
  const unitPrice = item.variant.product.basePrice + item.variant.priceDelta;
  const lineTotal = unitPrice * item.quantity;

  // Filter out "Standard" placeholder names from non-customizable products
  const combo = [
    item.variant.bodyColor.name,
    item.variant.pickguard.name,
    item.variant.hardware.name,
  ].filter((n) => n !== "Standard").join(" · ");

  const textColor = "var(--theme-card-text, #F2EFE4)";
  const subColor  = "var(--theme-panel-subtext, #8A8578)";

  // Circular qty buttons — exact match to CheckoutPanel style
  const qtyBtn: CSSProperties = {
    width: 26, height: 26, borderRadius: "50%",
    border: "1.5px solid var(--theme-accent, #FF3B1F)",
    background: "transparent",
    color: textColor,
    fontSize: 15, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, lineHeight: 1,
    opacity: 1,
  };

  return (
    // Three-column flex: thumbnail | details | remove
    // alignItems: stretch lets the remove column span the full row height
    <div style={{ display: "flex", gap: 12, opacity: pending ? 0.45 : 1, transition: "opacity 0.18s" }}>

      {/* Thumbnail */}
      <Link
        href={`/product/${item.variant.product.id}`}
        style={{
          flexShrink: 0, display: "block",
          position: "relative", width: 56, height: 56,
          borderRadius: 10, overflow: "hidden", background: "#2a2a2a",
          alignSelf: "flex-start",
        }}
      >
        <Image
          src={item.variant.imageUrl}
          alt={item.variant.product.name}
          fill
          style={{ objectFit: "cover" }}
          sizes="56px"
        />
      </Link>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + line total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/product/${item.variant.product.id}`}
              style={{ fontSize: 13, fontWeight: 700, color: textColor, textDecoration: "none", lineHeight: 1.3, display: "block" }}
            >
              {item.variant.product.name}
            </Link>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: subColor, lineHeight: 1.3 }}>
              {item.variant.product.brand.name}{combo ? ` · ${combo}` : ""}
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: textColor, flexShrink: 0, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {fmt.format(lineTotal)}
          </span>
        </div>

        {/* Qty stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <button
            style={qtyBtn}
            onClick={() => startTransition(() => updateCartItem(item.id, item.quantity - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: textColor, minWidth: 20, textAlign: "center" }}>
            {item.quantity}
          </span>
          <button
            style={qtyBtn}
            onClick={() => startTransition(() => updateCartItem(item.id, item.quantity + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove — separate flex child so it's vertically centered against the whole row */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => startTransition(() => removeCartItem(item.id))}
          style={{ background: "none", border: "none", cursor: "pointer", color: subColor, padding: 4, lineHeight: 1, opacity: 0.6 }}
          aria-label="Remove item"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

    </div>
  );
}
