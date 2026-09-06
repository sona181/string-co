import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import WishlistItemClient from "@/components/account/WishlistItemClient";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const saved = await prisma.savedProduct.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          variants: { orderBy: { priceDelta: "asc" }, take: 1 },
        },
      },
    },
  });

  const items = saved.map((s) => {
    const defaultVariant = s.product.variants[0];
    return {
      savedProductId: s.id,
      product: {
        id: s.product.id,
        name: s.product.name,
        basePrice: Number(s.product.basePrice),
        brand: { name: s.product.brand.name },
        category: { name: s.product.category.name },
        defaultVariantId: defaultVariant?.id ?? "",
        imageUrl: defaultVariant?.imageUrl ?? "https://placehold.co/400x400/1a1a1a/555?text=No+image",
      },
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Wishlist
        </h1>
        <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>
          {items.length} saved
        </p>
      </div>

      {items.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ border: "1px dashed var(--theme-border)" }}
        >
          <p className="mb-4" style={{ color: "var(--theme-panel-subtext)" }}>
            Nothing saved yet — browse the shop and heart items you like.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WishlistItemClient key={item.savedProductId} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
