import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function upsertCategory(name: string, slug: string, parentId?: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId: parentId ?? null },
    create: { name, slug, parentId: parentId ?? null },
  });
}

async function upsertBrand(name: string) {
  return prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
}

async function main() {
  // ── Top-level categories ───────────────────────────────────────────────────
  const guitars      = await upsertCategory("Guitars", "guitars");
  const keyboards    = await upsertCategory("Keyboards & Pianos", "keyboards");
  const drums        = await upsertCategory("Drums & Percussion", "drums");
  const strings      = await upsertCategory("Strings", "strings");
  const wind         = await upsertCategory("Wind Instruments", "wind");
  const accessories  = await upsertCategory("Accessories", "accessories");

  // ── Guitar subcategories ───────────────────────────────────────────────────
  const electric  = await upsertCategory("Electric Guitars", "electric-guitars", guitars.id);
  const acoustic  = await upsertCategory("Acoustic Guitars", "acoustic-guitars", guitars.id);
  const bass      = await upsertCategory("Bass Guitars", "bass-guitars", guitars.id);

  // ── Brands ────────────────────────────────────────────────────────────────
  const [fender, gibson, prs, yamaha, roland, korg, pearl, daddario] = await Promise.all([
    upsertBrand("Fender"),
    upsertBrand("Gibson"),
    upsertBrand("PRS"),
    upsertBrand("Yamaha"),
    upsertBrand("Roland"),
    upsertBrand("Korg"),
    upsertBrand("Pearl"),
    upsertBrand("D'Addario"),
  ]);

  // ── Placeholder "Standard" options — satisfy non-null FK on ProductVariant ──
  // Non-customizable products reference these; they have hexOrValue: null so the
  // swatch UI skips them (only products with ProductCustomizationOption rows show swatches).
  await Promise.all([
    prisma.customizationOption.upsert({ where: { id: "std-body-color" }, update: {}, create: { id: "std-body-color", optionType: "BODY_COLOR", name: "Standard", hexOrValue: null } }),
    prisma.customizationOption.upsert({ where: { id: "std-pickguard"  }, update: {}, create: { id: "std-pickguard",  optionType: "PICKGUARD",  name: "Standard", hexOrValue: null } }),
    prisma.customizationOption.upsert({ where: { id: "std-hardware"   }, update: {}, create: { id: "std-hardware",   optionType: "HARDWARE",   name: "Standard", hexOrValue: null } }),
  ]);

  // ── Customization options (guitar-specific) ────────────────────────────────
  const bodyColors = await Promise.all([
    prisma.customizationOption.upsert({ where: { id: "color-sunburst" }, update: {}, create: { id: "color-sunburst", optionType: "BODY_COLOR", name: "Sunburst", hexOrValue: "#8B4513" } }),
    prisma.customizationOption.upsert({ where: { id: "color-cherry"   }, update: {}, create: { id: "color-cherry",   optionType: "BODY_COLOR", name: "Cherry Red",     hexOrValue: "#DC143C" } }),
    prisma.customizationOption.upsert({ where: { id: "color-black"    }, update: {}, create: { id: "color-black",    optionType: "BODY_COLOR", name: "Midnight Black",  hexOrValue: "#1a1a1a" } }),
    prisma.customizationOption.upsert({ where: { id: "color-natural"  }, update: {}, create: { id: "color-natural",  optionType: "BODY_COLOR", name: "Natural",         hexOrValue: "#D2B48C" } }),
    prisma.customizationOption.upsert({ where: { id: "color-ocean"    }, update: {}, create: { id: "color-ocean",    optionType: "BODY_COLOR", name: "Ocean Blue",      hexOrValue: "#1E6091" } }),
  ]);

  const pickguards = await Promise.all([
    prisma.customizationOption.upsert({ where: { id: "pg-white" }, update: {}, create: { id: "pg-white", optionType: "PICKGUARD", name: "White",         hexOrValue: "#FFFFFF" } }),
    prisma.customizationOption.upsert({ where: { id: "pg-black" }, update: {}, create: { id: "pg-black", optionType: "PICKGUARD", name: "Black",         hexOrValue: "#1a1a1a" } }),
    prisma.customizationOption.upsert({ where: { id: "pg-tort"  }, update: {}, create: { id: "pg-tort",  optionType: "PICKGUARD", name: "Tortoiseshell", hexOrValue: "#8B4513" } }),
    prisma.customizationOption.upsert({ where: { id: "pg-none"  }, update: {}, create: { id: "pg-none",  optionType: "PICKGUARD", name: "None",          hexOrValue: null } }),
  ]);

  const hardware = await Promise.all([
    prisma.customizationOption.upsert({ where: { id: "hw-chrome" }, update: {}, create: { id: "hw-chrome", optionType: "HARDWARE", name: "Chrome",       hexOrValue: "#C0C0C0" } }),
    prisma.customizationOption.upsert({ where: { id: "hw-gold"   }, update: {}, create: { id: "hw-gold",   optionType: "HARDWARE", name: "Gold",         hexOrValue: "#FFD700" } }),
    prisma.customizationOption.upsert({ where: { id: "hw-black"  }, update: {}, create: { id: "hw-black",  optionType: "HARDWARE", name: "Black Chrome", hexOrValue: "#2C2C2C" } }),
  ]);

  // ── Products ──────────────────────────────────────────────────────────────
  type ProductInput = {
    id: string; name: string; description: string;
    basePrice: number; sku: string;
    categoryId: string; brandId: string;
  };

  const products: ProductInput[] = [
    // Electric guitars
    { id: "prod-strat",    name: "Stratocaster Classic",   description: "The iconic double-cutaway electric guitar, beloved for its versatile tone and comfortable playability. Perfect for blues, rock, and everything in between.",              basePrice: 899.99,   sku: "SKU-STRAT-001",   categoryId: electric.id,     brandId: fender.id  },
    { id: "prod-tele",     name: "Telecaster Standard",    description: "The original solid-body electric guitar. Bright, twangy, and built like a tank. From country to punk, the Tele does it all.",                                          basePrice: 849.99,   sku: "SKU-TELE-001",    categoryId: electric.id,     brandId: fender.id  },
    { id: "prod-lp",       name: "Les Paul Standard",      description: "Thick mahogany body and humbuckers deliver the warm, sustain-heavy tone that defined rock music. A legend in every sense.",                                             basePrice: 1299.99,  sku: "SKU-LP-001",      categoryId: electric.id,     brandId: gibson.id  },
    { id: "prod-custom24", name: "Custom 24",              description: "PRS's flagship model. Stunning figured maple top, wide-thin neck profile, and versatile switching make this a player's dream.",                                        basePrice: 1799.99,  sku: "SKU-PRS-001",     categoryId: electric.id,     brandId: prs.id     },
    // Acoustic guitars
    { id: "prod-dread",    name: "FG800 Dreadnought",      description: "Rich, balanced acoustic tone with excellent projection. Solid spruce top and scalloped bracing make this the best acoustic at its price point.",                        basePrice: 449.99,   sku: "SKU-YAM-001",     categoryId: acoustic.id,     brandId: yamaha.id  },
    { id: "prod-j45",      name: "J-45 Standard",          description: "Gibson's best-selling acoustic of all time. The warm, round sound of a slope-shouldered body with a solid mahogany back and sides.",                                    basePrice: 1699.99,  sku: "SKU-J45-001",     categoryId: acoustic.id,     brandId: gibson.id  },
    // Bass guitars
    { id: "prod-pbass",    name: "Precision Bass",         description: "The bass that started it all. Punchy, clear, and dependable — the P-Bass is the backbone of countless hit records.",                                                   basePrice: 949.99,   sku: "SKU-PBASS-001",   categoryId: bass.id,         brandId: fender.id  },
    { id: "prod-jbass",    name: "Jazz Bass",              description: "Sleek, versatile, and comfortable to play. Dual single-coil pickups deliver a wide range of tones from deep thump to bright snap.",                                     basePrice: 999.99,   sku: "SKU-JBASS-001",   categoryId: bass.id,         brandId: fender.id  },
    // Keyboards
    { id: "prod-rd88",     name: "RD-88 Stage Piano",      description: "88 weighted keys, premium SuperNATURAL piano tones, and a road-ready build. The gigging pianist's go-to.",                                                             basePrice: 1499.99,  sku: "SKU-RD88-001",    categoryId: keyboards.id,    brandId: roland.id  },
    { id: "prod-kross2",   name: "Kross 2 Synthesizer",    description: "61-key battery-powered synthesizer with 500+ sounds, sequencer, and a featherlight body. Take it anywhere.",                                                           basePrice: 499.99,   sku: "SKU-KROSS-001",   categoryId: keyboards.id,    brandId: korg.id    },
    { id: "prod-p45",      name: "P-45 Digital Piano",     description: "Yamaha's entry-level portable digital piano. Graded Hammer action, authentic piano tone, and a clean modern look.",                                                    basePrice: 449.99,   sku: "SKU-P45-001",     categoryId: keyboards.id,    brandId: yamaha.id  },
    // Drums
    { id: "prod-export",   name: "Export Rock Kit",        description: "The world's best-selling drum kit. Built tough, tuned well, and ready to take a beating night after night.",                                                           basePrice: 849.99,   sku: "SKU-EXPORT-001",  categoryId: drums.id,        brandId: pearl.id   },
    { id: "prod-td17",     name: "TD-17KVX Electronic Kit","description": "Roland's flagship mid-range e-kit. Mesh heads, module with hundreds of sounds, and near-acoustic feel. No noise complaints.",                                       basePrice: 1799.99,  sku: "SKU-TD17-001",    categoryId: drums.id,        brandId: roland.id  },
    // Strings
    { id: "prod-violin",   name: "Intermediate Violin 4/4","description": "Hand-crafted spruce top, maple back and sides, and a warm, projecting sound. Comes setup and ready to play.",                                                        basePrice: 349.99,   sku: "SKU-VLN-001",     categoryId: strings.id,      brandId: yamaha.id  },
    // Wind
    { id: "prod-alto-sax", name: "Alto Saxophone Student", "description": "Yellow brass body, high-F# key, and a smooth action. The ideal first alto sax for students and hobbyists.",                                                          basePrice: 599.99,   sku: "SKU-SAX-001",     categoryId: wind.id,         brandId: yamaha.id  },
    // Accessories
    { id: "prod-strings",  name: "Electric Guitar Strings — 10-46", "description": "D'Addario's most popular set. Nickel-wound, consistent intonation, and long-lasting tone.",                                                                 basePrice: 12.99,    sku: "SKU-STR-001",     categoryId: accessories.id,  brandId: daddario.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  // ── Customization options → electric guitars and basses ───────────────────
  const customizableIds = ["prod-strat", "prod-tele", "prod-lp", "prod-custom24", "prod-pbass", "prod-jbass"];
  const allOptions = [...bodyColors, ...pickguards, ...hardware];

  for (const productId of customizableIds) {
    for (const option of allOptions) {
      await prisma.productCustomizationOption.upsert({
        where: { productId_optionId: { productId, optionId: option.id } },
        update: {},
        create: { productId, optionId: option.id },
      });
    }
  }

  // ── Variants for Stratocaster ──────────────────────────────────────────────
  const stratVariants = [
    { comboKey: "sunburst_white_chrome", bodyColorOptionId: "color-sunburst", pickguardOptionId: "pg-white", hardwareOptionId: "hw-chrome", priceDelta: 0,  imageUrl: "https://placehold.co/600x400/8B4513/white?text=Sunburst+%2F+White+%2F+Chrome" },
    { comboKey: "cherry_black_chrome",   bodyColorOptionId: "color-cherry",   pickguardOptionId: "pg-black", hardwareOptionId: "hw-chrome", priceDelta: 0,  imageUrl: "https://placehold.co/600x400/DC143C/white?text=Cherry+%2F+Black+%2F+Chrome"   },
    { comboKey: "black_black_black",     bodyColorOptionId: "color-black",    pickguardOptionId: "pg-black", hardwareOptionId: "hw-black",  priceDelta: 0,  imageUrl: "https://placehold.co/600x400/1a1a1a/white?text=Black+%2F+Black+%2F+Black"     },
    { comboKey: "ocean_white_gold",      bodyColorOptionId: "color-ocean",    pickguardOptionId: "pg-white", hardwareOptionId: "hw-gold",   priceDelta: 50, imageUrl: "https://placehold.co/600x400/1E6091/white?text=Ocean+%2F+White+%2F+Gold"      },
  ];

  for (const v of stratVariants) {
    await prisma.productVariant.upsert({
      where: { productId_comboKey: { productId: "prod-strat", comboKey: v.comboKey } },
      update: {},
      create: { ...v, productId: "prod-strat", sku: `SKU-STRAT-${v.comboKey}` },
    });
  }

  // ── Default single variants for non-customizable products ─────────────────
  const singleVariantProducts = [
    "prod-rd88", "prod-kross2", "prod-p45",
    "prod-export", "prod-td17",
    "prod-violin", "prod-alto-sax", "prod-strings",
    "prod-dread", "prod-j45",
  ];

  for (const productId of singleVariantProducts) {
    const existing = await prisma.productVariant.findFirst({ where: { productId } });
    if (!existing) {
      await prisma.productVariant.create({
        data: {
          productId,
          bodyColorOptionId: "color-natural",
          pickguardOptionId: "pg-none",
          hardwareOptionId: "hw-chrome",
          comboKey: "default",
          imageUrl: `https://placehold.co/600x400/e5e7eb/9ca3af?text=${encodeURIComponent(productId)}`,
          priceDelta: 0,
          sku: `${productId}-default`,
        },
      });
    }
  }

  console.log("✅ Seed complete — full music shop");
}

main().catch(console.error).finally(() => prisma.$disconnect());
