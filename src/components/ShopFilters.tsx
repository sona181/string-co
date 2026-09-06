"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";

export type FilterCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
export type FilterBrand = { name: string };

type Props = {
  categories: FilterCategory[];
  brands: FilterBrand[];
  priceRange: { min: number; max: number };
};

const PRICE_BUCKETS = [
  { label: "Under $100",        min: 0,    max: 100   },
  { label: "$100 – $500",       min: 100,  max: 500   },
  { label: "$500 – $1,000",     min: 500,  max: 1000  },
  { label: "$1,000 – $2,000",   min: 1000, max: 2000  },
  { label: "Over $2,000",       min: 2000, max: 999999 },
];

export default function ShopFilters({ categories, brands, priceRange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(params.toString());
      if (value) p.set(key, value); else p.delete(key);
      p.delete("page");
      router.push(`${pathname}?${p.toString()}`);
    },
    [params, pathname, router]
  );

  const activeCategory = params.get("category");
  const activeBrand    = params.get("brand");
  const activeMin      = params.get("min");
  const activeMax      = params.get("max");
  const hasFilters     = activeCategory || activeBrand || activeMin;

  // Only show price buckets that make sense for the actual catalog range
  const relevantBuckets = PRICE_BUCKETS.filter(
    (b) => b.min < priceRange.max && b.max > priceRange.min
  );

  return (
    <aside className="w-full">
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-xs text-spray-red font-black uppercase tracking-wide mb-6 hover:brightness-110 transition-all"
        >
          <X className="w-3.5 h-3.5" /> Clear filters
        </button>
      )}

      {/* Category */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-4">Category</p>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => set("category", activeCategory === cat.slug ? null : cat.slug)}
                className={`w-full text-left text-xs font-black uppercase tracking-wide py-1.5 transition-colors ${
                  activeCategory === cat.slug
                    ? "text-tag-yellow"
                    : "text-rust-gray hover:text-concrete"
                }`}
              >
                {cat.name}
              </button>
              {cat.children.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => set("category", activeCategory === sub.slug ? null : sub.slug)}
                  className={`w-full text-left text-xs pl-4 py-1 transition-colors ${
                    activeCategory === sub.slug
                      ? "text-tag-yellow font-black"
                      : "text-rust-gray/60 hover:text-rust-gray"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-4">Brand</p>
          <ul className="space-y-1">
            {brands.map((b) => (
              <li key={b.name}>
                <button
                  onClick={() => set("brand", activeBrand === b.name ? null : b.name)}
                  className={`w-full text-left text-xs font-black uppercase tracking-wide py-1.5 transition-colors ${
                    activeBrand === b.name
                      ? "text-tag-yellow"
                      : "text-rust-gray hover:text-concrete"
                  }`}
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-4">Price</p>
        <ul className="space-y-1">
          {relevantBuckets.map((r) => {
            const active = activeMin === String(r.min) && activeMax === String(r.max);
            return (
              <li key={r.label}>
                <button
                  onClick={() => {
                    if (active) { set("min", null); set("max", null); }
                    else { set("min", String(r.min)); set("max", String(r.max)); }
                  }}
                  className={`w-full text-left text-xs font-black uppercase tracking-wide py-1.5 transition-colors ${
                    active ? "text-tag-yellow" : "text-rust-gray hover:text-concrete"
                  }`}
                >
                  {r.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
