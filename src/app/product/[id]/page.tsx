import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import ProductCustomizer from "@/components/ProductCustomizer";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { brand: true } });
  if (!product) return {};
  return { title: `${product.name} — StringCo`, description: product.description };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      variants: true,
      customizationOptions: { include: { option: true } },
      reviews: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const bodyColors = product.customizationOptions.filter((o) => o.option.optionType === "BODY_COLOR").map((o) => o.option);
  const pickguards = product.customizationOptions.filter((o) => o.option.optionType === "PICKGUARD").map((o) => o.option);
  const hardwareOptions = product.customizationOptions.filter((o) => o.option.optionType === "HARDWARE").map((o) => o.option);
  const isCustomizable = bodyColors.length > 0 || pickguards.length > 0 || hardwareOptions.length > 0;
  const defaultVariant = product.variants[0] ?? null;

  // Check if user has a qualifying order to write a review
  let canReview = false;
  if (session?.user?.id) {
    const qualifyingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PAID", "DELIVERED"] },
        items: { some: { variant: { productId: product.id } } },
      },
    });
    canReview = !!qualifyingOrder;
  }

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;

  const categoryLabel = product.category.name.charAt(0) + product.category.name.slice(1).toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
        <Link href="/shop" className="hover:text-gray-600">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-gray-600">{categoryLabel}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <ProductCustomizer
        product={{
          id: product.id,
          name: product.name,
          brandName: product.brand.name,
          categoryName: product.category.name,
          basePrice: Number(product.basePrice),
          description: product.description,
        }}
        defaultVariant={defaultVariant ? { ...defaultVariant, priceDelta: Number(defaultVariant.priceDelta) } : null}
        variants={product.variants.map((v) => ({ ...v, priceDelta: Number(v.priceDelta) }))}
        bodyColors={isCustomizable ? bodyColors.map((o) => ({ id: o.id, name: o.name, hexOrValue: o.hexOrValue })) : []}
        pickguards={isCustomizable ? pickguards.map((o) => ({ id: o.id, name: o.name, hexOrValue: o.hexOrValue })) : []}
        hardwareOptions={isCustomizable ? hardwareOptions.map((o) => ({ id: o.id, name: o.name, hexOrValue: o.hexOrValue })) : []}
        productImageUrl={product.imageUrl}
        model3dUrl={product.model3dUrl}
        userId={session?.user?.id ?? null}
      />

      {/* Tabs: Description / Reviews */}
      <div className="mt-16 border-t border-gray-100 pt-10">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold mb-4">About this product</h2>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">Brand: {product.brand.name}</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">Category: {categoryLabel}</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">SKU: {product.sku}</span>
          </div>

          {product.audioUrl && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Hear it</h3>
              <audio controls src={product.audioUrl} className="w-full max-w-md">
                <track kind="captions" />
              </audio>
            </div>
          )}

        </div>

        {/* Reviews */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Reviews</h2>
              {avgRating && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {avgRating.toFixed(1)} / 5 · {product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {canReview && (
              <Link
                href={`/product/${product.id}/review`}
                className="text-sm font-medium bg-black text-white px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors"
              >
                Write a review
              </Link>
            )}
          </div>

          {product.reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviews yet — be the first!</p>
          ) : (
            <div className="space-y-6 max-w-3xl">
              {product.reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{r.user.fullName ?? "Customer"}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
