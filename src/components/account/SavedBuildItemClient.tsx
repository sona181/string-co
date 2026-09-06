"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { removeSavedVariant } from "@/lib/actions/saved-builds";
import { addToCart } from "@/lib/actions/cart";

type Props = {
  savedVariantId: string;
  label?: string | null;
  variant: {
    id: string;
    imageUrl: string;
    comboKey: string;
    priceDelta: number;
    product: {
      id: string;
      name: string;
      basePrice: number;
      brand: { name: string };
    };
  };
};

export default function SavedBuildItemClient({ savedVariantId, label, variant }: Readonly<Props>) {
  const [pending, startTransition] = useTransition();
  const totalPrice = variant.product.basePrice + variant.priceDelta;
  const combo = variant.comboKey.replaceAll("_", " · ");

  return (
    <div
      className="flex gap-4 rounded-2xl p-4"
      style={{ background: "var(--theme-card-bg)", border: "1px solid var(--theme-border)" }}
    >
      <Link href={`/product/${variant.product.id}`} className="shrink-0">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Image src={variant.imageUrl} alt={variant.product.name} fill className="object-cover" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/product/${variant.product.id}`}>
          <p
            className="font-semibold text-sm truncate transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-text)" }}
          >
            {label ?? variant.product.name}
          </p>
        </Link>
        <p className="text-xs mt-0.5" style={{ color: "var(--theme-panel-subtext)" }}>
          {variant.product.brand.name}
        </p>
        <p className="text-xs mt-0.5 capitalize truncate" style={{ color: "var(--theme-panel-subtext)", opacity: 0.75 }}>
          {combo}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
          ${totalPrice.toFixed(2)}
        </p>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => startTransition(async () => { await addToCart(variant.id); })}
          disabled={pending}
          className="p-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--theme-accent)", color: "#fff" }}
          title="Add to cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
        <button
          onClick={() => startTransition(async () => { await removeSavedVariant(savedVariantId); })}
          disabled={pending}
          className="p-2 rounded-lg transition-colors hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50"
          style={{ color: "var(--theme-panel-subtext)" }}
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
