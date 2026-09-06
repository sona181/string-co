import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import SavedBuildItemClient from "@/components/account/SavedBuildItemClient";

export default async function SavedBuildsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const saved = await prisma.savedVariant.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      variant: {
        include: {
          product: { include: { brand: true } },
        },
      },
    },
  });

  const items = saved.map((s) => ({
    savedVariantId: s.id,
    label: s.label,
    variant: {
      id: s.variant.id,
      imageUrl: s.variant.imageUrl,
      comboKey: s.variant.comboKey,
      priceDelta: Number(s.variant.priceDelta),
      product: {
        id: s.variant.product.id,
        name: s.variant.product.name,
        basePrice: Number(s.variant.product.basePrice),
        brand: { name: s.variant.product.brand.name },
      },
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Saved builds
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
            No saved builds. Customise an instrument and save your configuration.
          </p>
          <Link
            href="/shop?category=guitars"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
          >
            Browse instruments
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <SavedBuildItemClient key={item.savedVariantId} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
