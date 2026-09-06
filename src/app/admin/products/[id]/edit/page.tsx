import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, brands, allOptions] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        customizationOptions: { select: { optionId: true } },
        variants: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            bodyColorOptionId: true,
            pickguardOptionId: true,
            hardwareOptionId:  true,
            imageUrl: true,
            priceDelta: true,
            sku: true,
          },
        },
      },
    }),
    prisma.category.findMany({ orderBy: [{ parentId: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.customizationOption.findMany({ orderBy: [{ optionType: "asc" }, { name: "asc" }] }),
  ]);

  if (!product) notFound();

  const existingProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    basePrice: Number(product.basePrice),
    sku: product.sku,
    brandId: product.brandId,
    categoryId: product.categoryId,
    imageUrl: product.imageUrl,
    model3dUrl: product.model3dUrl,
    audioUrl: product.audioUrl,
    genre: product.genre ?? null,
    attachedOptionIds: product.customizationOptions.map(o => o.optionId),
    variants: product.variants.map(v => ({
      id: v.id,
      bodyColorOptionId: v.bodyColorOptionId,
      pickguardOptionId: v.pickguardOptionId,
      hardwareOptionId:  v.hardwareOptionId,
      imageUrl: v.imageUrl,
      priceDelta: Number(v.priceDelta),
      sku: v.sku,
    })),
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-concrete">Edit product</h1>
        <p className="text-sm text-rust-gray mt-1 font-mono">{product.name}</p>
      </div>
      <ProductForm
        product={existingProduct}
        categories={categories}
        brands={brands}
        allOptions={allOptions.map(o => ({ id: o.id, optionType: o.optionType, name: o.name, hexOrValue: o.hexOrValue }))}
      />
    </div>
  );
}
