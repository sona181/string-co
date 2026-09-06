"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { reorder } from "@/lib/actions/orders";

// Semantic status colors — dark-tinted to fit dark background, kept distinct per status
const STATUS_STYLES: Record<string, React.CSSProperties> = {
  PENDING:   { background: "rgba(234,179,8,0.12)",  color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)"  },
  PAID:      { background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" },
  SHIPPED:   { background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" },
  DELIVERED: { background: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)"  },
  CANCELLED: { background: "rgba(239,68,68,0.12)",  color: "#f87171", border: "1px solid rgba(239,68,68,0.3)"  },
};

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    id: string;
    imageUrl: string;
    comboKey: string;
    product: { id: string; name: string; brand: { name: string } };
    bodyColor: { name: string } | null;
  };
};

type Props = {
  order: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    address: { line1: string; city: string; state: string; postalCode: string } | null;
    items: OrderItem[];
  };
};

const cardBase: React.CSSProperties = {
  background: "var(--theme-card-bg)",
  border: "1px solid var(--theme-border)",
  borderRadius: 16,
  overflow: "hidden",
};

export default function OrderCard({ order }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const shortId = order.id.slice(-8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;

  return (
    <div style={cardBase}>
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? "rgba(255,59,31,0.04)" : "transparent" }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Order</p>
            <p className="font-mono text-sm font-semibold" style={{ color: "var(--theme-text)" }}>#{shortId}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Date</p>
            <p className="text-sm" style={{ color: "var(--theme-text)" }}>{date}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Total</p>
            <p className="text-sm font-semibold" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
              ${order.total.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Items</p>
            <p className="text-sm" style={{ color: "var(--theme-text)" }}>{order.items.length}</p>
          </div>
          <span
            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
            style={statusStyle}
          >
            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--theme-panel-subtext)" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--theme-panel-subtext)" }} />}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 py-4 space-y-4" style={{ borderTop: "1px solid var(--theme-border)" }}>
          {/* Items */}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div
                  className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <Image src={item.variant.imageUrl} alt={item.variant.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--theme-text)" }}>
                    {item.variant.product.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--theme-panel-subtext)" }}>
                    {item.variant.product.brand.name}
                  </p>
                  {item.variant.bodyColor && (
                    <p className="text-xs capitalize" style={{ color: "var(--theme-panel-subtext)" }}>
                      {item.variant.comboKey.replaceAll("_", " · ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
                    ${item.unitPrice.toFixed(2)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--theme-panel-subtext)" }}>Qty {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Address + reorder */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 pt-3"
            style={{ borderTop: "1px solid var(--theme-border)" }}
          >
            <p className="text-xs" style={{ color: "var(--theme-panel-subtext)" }}>
              {order.address
                ? `Shipped to: ${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.postalCode}`
                : "No shipping address on record"}
            </p>
            <button
              onClick={() => startTransition(async () => { await reorder(order.id); })}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: "var(--theme-accent)",
                color: "#fff",
                fontFamily: "var(--theme-font-eyebrow, sans-serif)",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {pending ? "Adding…" : "Reorder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
