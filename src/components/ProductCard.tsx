"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/actions/cart";
import { useTransition } from "react";

type Props = {
  product: {
    id: string;
    name: string;
    basePrice: number;
    sku: string;
    brand: { name: string };
    category: { name: string };
    variants: { id: string; imageUrl: string; priceDelta: number }[];
  };
};

export default function ProductCard({ product }: Props) {
  const [pending, startTransition] = useTransition();
  const firstVariant = product.variants[0];
  const imageUrl = firstVariant?.imageUrl ?? `https://placehold.co/600x400/1a1a1a/8A8578?text=${encodeURIComponent(product.name)}`;
  const displayPrice = Number(product.basePrice) + Number(firstVariant?.priceDelta ?? 0);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!firstVariant) return;
    startTransition(async () => { await addToCart(firstVariant.id, 1); });
  }

  return (
    <Link href={`/product/${product.id}`} className="group relative flex flex-col bg-[#111111] overflow-hidden border border-rust-gray/10 hover:border-rust-gray/30 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[#1a1a1a] overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Quick-add on hover */}
        {firstVariant && (
          <button
            onClick={handleAddToCart}
            disabled={pending}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-spray-red text-black p-2.5 hover:brightness-110 disabled:opacity-50"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-rust-gray font-medium uppercase tracking-wider">{product.brand.name}</span>
          <span className="text-xs font-black uppercase tracking-wide text-rust-gray/60">
            {product.category.name.charAt(0) + product.category.name.slice(1).toLowerCase()}
          </span>
        </div>
        <h3 className="font-black uppercase tracking-tight text-concrete text-sm leading-snug group-hover:text-tag-yellow transition-colors">
          {product.name}
        </h3>
        <p className="font-black text-concrete mt-auto pt-2 text-base">
          ${displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </Link>
  );
}
