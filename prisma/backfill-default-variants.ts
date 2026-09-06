/**
 * One-shot backfill: create a default ProductVariant for every product that has none.
 * Run with:  npx tsx prisma/backfill-default-variants.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const STD_BODY_ID = "std-body-color";
const STD_PG_ID   = "std-pickguard";
const STD_HW_ID   = "std-hardware";

async function main() {
  // 1. Upsert the three placeholder options (idempotent)
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
  console.log("✓ Standard placeholder options ensured");

  // 2. Find all products with zero variants
  const allProducts = await prisma.product.findMany({
    select: { id: true, sku: true, imageUrl: true, name: true },
  });

  const withVariants = new Set(
    (await prisma.productVariant.findMany({ select: { productId: true } }))
      .map(v => v.productId),
  );

  const missing = allProducts.filter(p => !withVariants.has(p.id));

  if (missing.length === 0) {
    console.log("✓ All products already have at least one variant — nothing to do");
    return;
  }

  console.log(`Found ${missing.length} product(s) with no variants — backfilling…`);

  for (const p of missing) {
    await prisma.productVariant.create({
      data: {
        productId:         p.id,
        bodyColorOptionId: STD_BODY_ID,
        pickguardOptionId: STD_PG_ID,
        hardwareOptionId:  STD_HW_ID,
        comboKey:   "standard",
        imageUrl:   p.imageUrl ?? null,
        priceDelta: 0,
        sku:        `${p.sku}-DEFAULT`,
      },
    });
    console.log(`  ✓ ${p.name} (${p.id})`);
  }

  console.log("✅ Backfill complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
