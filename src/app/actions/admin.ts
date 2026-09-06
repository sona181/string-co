"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function strOrNull(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

// ── Stable placeholder options used by non-customizable products ──────────────
// These satisfy the non-null FK requirements on ProductVariant without surfacing
// as choosable swatches (the UI skips rendering options for products with no
// attached ProductCustomizationOption rows).
const STD_BODY_ID = "std-body-color";
const STD_PG_ID   = "std-pickguard";
const STD_HW_ID   = "std-hardware";

async function ensureStandardOptions() {
  await Promise.all([
    prisma.customizationOption.upsert({
      where:  { id: STD_BODY_ID },
      update: {},
      create: { id: STD_BODY_ID, optionType: "BODY_COLOR", name: "Standard", hexOrValue: null },
    }),
    prisma.customizationOption.upsert({
      where:  { id: STD_PG_ID },
      update: {},
      create: { id: STD_PG_ID, optionType: "PICKGUARD", name: "Standard", hexOrValue: null },
    }),
    prisma.customizationOption.upsert({
      where:  { id: STD_HW_ID },
      update: {},
      create: { id: STD_HW_ID, optionType: "HARDWARE", name: "Standard", hexOrValue: null },
    }),
  ]);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(fd: FormData) {
  await requireAdmin();
  const name     = str(fd, "name");
  const slug     = str(fd, "slug");
  const parentId = strOrNull(fd, "parentId");
  if (!name || !slug) return { error: "Name and slug are required" };
  try {
    const cat = await prisma.category.create({ data: { name, slug, parentId } });
    revalidatePath("/admin/categories");
    return { ok: true, id: cat.id };
  } catch {
    return { error: "Slug already taken or database error" };
  }
}

export async function updateCategory(fd: FormData) {
  await requireAdmin();
  const id       = str(fd, "id");
  const name     = str(fd, "name");
  const slug     = str(fd, "slug");
  const parentId = strOrNull(fd, "parentId");
  if (!id || !name || !slug) return { error: "Missing fields" };
  try {
    await prisma.category.update({ where: { id }, data: { name, slug, parentId } });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch {
    return { error: "Update failed" };
  }
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch {
    return { error: "Cannot delete — category may have products attached" };
  }
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function createBrand(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  try {
    const brand = await prisma.brand.create({ data: { name } });
    revalidatePath("/admin/brands");
    return { ok: true, id: brand.id };
  } catch {
    return { error: "Brand name already exists" };
  }
}

export async function updateBrand(fd: FormData) {
  await requireAdmin();
  const id   = str(fd, "id");
  const name = str(fd, "name");
  if (!id || !name) return { error: "Missing fields" };
  try {
    await prisma.brand.update({ where: { id }, data: { name } });
    revalidatePath("/admin/brands");
    return { ok: true };
  } catch {
    return { error: "Update failed" };
  }
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  try {
    await prisma.brand.delete({ where: { id } });
    revalidatePath("/admin/brands");
    return { ok: true };
  } catch {
    return { error: "Cannot delete — brand may have products attached" };
  }
}

// ─── Customization options ────────────────────────────────────────────────────

export async function createCustomizationOption(fd: FormData) {
  await requireAdmin();
  const optionType = str(fd, "optionType") as "BODY_COLOR" | "PICKGUARD" | "HARDWARE";
  const name       = str(fd, "name");
  const hexOrValue = strOrNull(fd, "hexOrValue");
  if (!name || !optionType) return { error: "Missing fields" };
  const opt = await prisma.customizationOption.create({ data: { optionType, name, hexOrValue } });
  return { ok: true, id: opt.id };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type VariantDraft = {
  id?: string;
  bodyColorOptionId: string;
  pickguardOptionId: string;
  hardwareOptionId: string;
  imageUrl: string;
  priceDelta: number;
  sku: string;
};

export type ProductSaveData = {
  id?: string;
  name: string;
  description: string;
  basePrice: number;
  sku: string;
  brandId: string;
  categoryId: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  model3dUrl: string | null;
  audioUrl: string | null;
  genre: string | null;
  attachedOptionIds: string[];
  variants: VariantDraft[];
  removedVariantIds: string[];
};

export async function saveProduct(data: ProductSaveData): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireAdmin();
  await ensureStandardOptions();

  try {
    // Build comboKey from option names (fetch all at once to avoid n+1)
    const allOptionIds = [
      ...new Set(data.variants.flatMap(v => [v.bodyColorOptionId, v.pickguardOptionId, v.hardwareOptionId])),
    ];
    const optionNames = await prisma.customizationOption.findMany({
      where: { id: { in: allOptionIds } },
      select: { id: true, name: true },
    });
    const nameById = Object.fromEntries(optionNames.map(o => [o.id, o.name]));

    const makeComboKey = (v: VariantDraft) =>
      `${nameById[v.bodyColorOptionId]}_${nameById[v.pickguardOptionId]}_${nameById[v.hardwareOptionId]}`
        .toLowerCase()
        .replace(/\s+/g, "-");

    const productId = await prisma.$transaction(async (tx) => {
      // 1. Upsert product
      let pid: string;
      if (data.id) {
        await tx.product.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description,
            basePrice: data.basePrice,
            sku: data.sku,
            brandId: data.brandId,
            categoryId: data.categoryId,
            imageUrl: data.imageUrl,
            imageWidth: data.imageWidth,
            imageHeight: data.imageHeight,
            model3dUrl: data.model3dUrl,
            audioUrl: data.audioUrl,
            genre: (data.genre || null) as import("@/generated/prisma/client").Genre | null,
          },
        });
        pid = data.id;
      } else {
        const p = await tx.product.create({
          data: {
            name: data.name,
            description: data.description,
            basePrice: data.basePrice,
            sku: data.sku,
            brandId: data.brandId,
            categoryId: data.categoryId,
            imageUrl: data.imageUrl,
            imageWidth: data.imageWidth,
            imageHeight: data.imageHeight,
            model3dUrl: data.model3dUrl,
            audioUrl: data.audioUrl,
            genre: (data.genre || null) as import("@/generated/prisma/client").Genre | null,
          },
        });
        pid = p.id;
      }

      // 2. Sync attached customization options (replace entirely)
      await tx.productCustomizationOption.deleteMany({ where: { productId: pid } });
      if (data.attachedOptionIds.length > 0) {
        await tx.productCustomizationOption.createMany({
          data: data.attachedOptionIds.map(optionId => ({ productId: pid, optionId })),
        });
      }

      // 3. Delete removed variants
      if (data.removedVariantIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: data.removedVariantIds } } });
      }

      // 4. Upsert variants
      for (const v of data.variants) {
        const comboKey = makeComboKey(v);
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              bodyColorOptionId: v.bodyColorOptionId,
              pickguardOptionId: v.pickguardOptionId,
              hardwareOptionId:  v.hardwareOptionId,
              imageUrl:   v.imageUrl,
              priceDelta: v.priceDelta,
              sku:        v.sku,
              comboKey,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId:         pid,
              bodyColorOptionId: v.bodyColorOptionId,
              pickguardOptionId: v.pickguardOptionId,
              hardwareOptionId:  v.hardwareOptionId,
              imageUrl:   v.imageUrl,
              priceDelta: v.priceDelta,
              sku:        v.sku,
              comboKey,
            },
          });
        }
      }

      // 5. Guarantee at least one purchasable variant
      const variantCount = await tx.productVariant.count({ where: { productId: pid } });
      if (variantCount === 0) {
        const p = await tx.product.findUnique({ where: { id: pid }, select: { sku: true, imageUrl: true } });
        await tx.productVariant.create({
          data: {
            productId:         pid,
            bodyColorOptionId: STD_BODY_ID,
            pickguardOptionId: STD_PG_ID,
            hardwareOptionId:  STD_HW_ID,
            comboKey:  "standard",
            imageUrl:  p?.imageUrl ?? "",
            priceDelta: 0,
            sku: `${p?.sku ?? pid}-DEFAULT`,
          },
        });
      }

      return pid;
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, id: productId };
  } catch (err) {
    console.error("saveProduct error:", err);
    return { ok: false, error: "Save failed — check for duplicate SKUs or missing required fields" };
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true };
  } catch {
    return { error: "Delete failed" };
  }
}

export async function saveProductAndRedirect(data: ProductSaveData) {
  const result = await saveProduct(data);
  if (result.ok) redirect("/admin/products");
  return result;
}

// Simple FormData-based action for the plain HTML create form
export async function createProductFromForm(
  _prev: { error?: string } | undefined,
  fd: FormData,
): Promise<{ error?: string }> {
  "use server";
  await requireAdmin();

  const name        = str(fd, "name");
  const description = str(fd, "description");
  const basePriceRaw = str(fd, "basePrice");
  const sku         = str(fd, "sku");
  const brandId     = str(fd, "brandId");
  const categoryId  = str(fd, "categoryId");

  if (!name || !description || !basePriceRaw || !sku || !brandId || !categoryId)
    return { error: "All fields are required." };

  const basePrice = Number.parseFloat(basePriceRaw);
  if (Number.isNaN(basePrice) || basePrice < 0)
    return { error: "Enter a valid price." };

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing)
    return { error: `SKU "${sku}" is already taken — choose a unique one.` };

  const imageUrl    = strOrNull(fd, "imageUrl");
  const audioUrl    = strOrNull(fd, "audioUrl");
  const model3dUrl  = strOrNull(fd, "model3dUrl");
  const imageWidth  = fd.get("imageWidth")  ? Number(fd.get("imageWidth"))  : null;
  const imageHeight = fd.get("imageHeight") ? Number(fd.get("imageHeight")) : null;
  const genreRaw    = strOrNull(fd, "genre");
  const genre       = genreRaw as import("@/generated/prisma/client").Genre | null;

  await ensureStandardOptions();

  const product = await prisma.product.create({
    data: { name, description, basePrice, sku, brandId, categoryId, imageUrl, imageWidth, imageHeight, audioUrl, model3dUrl, genre },
  });

  // Every new product needs at least one variant — create the placeholder default
  await prisma.productVariant.create({
    data: {
      productId:         product.id,
      bodyColorOptionId: STD_BODY_ID,
      pickguardOptionId: STD_PG_ID,
      hardwareOptionId:  STD_HW_ID,
      comboKey:   "standard",
      imageUrl:   imageUrl ?? "",
      priceDelta: 0,
      sku:        `${sku}-DEFAULT`,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}
