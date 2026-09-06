import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import DomeGallery from "@/components/DomeGallery";
import ShopSearchBar from "@/components/ShopSearchBar";
import type { Prisma, Genre } from "@/generated/prisma/client";
import { getTheme } from "@/lib/themes";
import type { ProductData, CustomizationGroup } from "@/lib/shopTypes";

type SearchParams = {
  category?: string;
  brand?: string;
  min?: string;
  max?: string;
  q?: string;
  sort?: string;
  genre?: string;
};

type PageProps = {
  readonly searchParams: Promise<SearchParams>;
};

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price_asc")  return { basePrice: "asc"  };
  if (sort === "price_desc") return { basePrice: "desc" };
  if (sort === "name_asc")   return { name: "asc"       };
  return { createdAt: "desc" };
}

async function getProducts(sp: SearchParams) {
  const where: Prisma.ProductWhereInput = {};

  if (sp.category) {
    where.OR = [
      { category: { slug: sp.category } },
      { category: { parent: { slug: sp.category } } },
    ];
  }
  if (sp.brand) where.brand = { name: sp.brand };
  if (sp.q) {
    where.AND = [{
      OR: [
        { name:        { contains: sp.q, mode: "insensitive" } },
        { description: { contains: sp.q, mode: "insensitive" } },
        { brand:    { name: { contains: sp.q, mode: "insensitive" } } },
        { category: { name: { contains: sp.q, mode: "insensitive" } } },
      ],
    }];
  }
  if (sp.genre) where.genre = sp.genre as Genre;
  if (sp.min || sp.max) {
    where.basePrice = {};
    if (sp.min) where.basePrice.gte = Number(sp.min);
    if (sp.max && Number(sp.max) < 999999) where.basePrice.lte = Number(sp.max);
  }

  return prisma.product.findMany({
    where,
    orderBy: buildOrderBy(sp.sort),
    include: {
      brand: true,
      category: true,
      variants: { take: 1, orderBy: { priceDelta: "asc" } },
      reviews: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      customizationOptions: {
        include: { option: true },
      },
    },
  });
}

export default async function ShopPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const [products, session] = await Promise.all([
    getProducts(sp),
    auth(),
  ]);

  const userId = session?.user?.id ?? null;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  // Fetch current user's saved products for wishlist state
  let savedProductIds = new Set<string>();
  if (userId) {
    const saved = await prisma.savedProduct.findMany({
      where: { userId },
      select: { productId: true },
    });
    savedProductIds = new Set(saved.map((s) => s.productId));
  }

  // Build serializable product data for client component
  const productDataList: ProductData[] = products.map((p) => {
    const variant = p.variants[0];
    const avgRating =
      p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : null;

    // Group customization options by type
    const byType = new Map<string, { name: string; hexOrValue: string | null }[]>();
    for (const pco of p.customizationOptions) {
      const t = pco.option.optionType;
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t)!.push({ name: pco.option.name, hexOrValue: pco.option.hexOrValue });
    }
    const customizationGroups: CustomizationGroup[] = Array.from(byType.entries()).map(
      ([type, options]) => ({ type: type as CustomizationGroup["type"], options }),
    );

    return {
      id: p.id,
      name: p.name,
      brandName: p.brand.name,
      categoryName: p.category.name,
      basePrice: Number(p.basePrice),
      description: p.description,
      defaultVariantId: variant?.id ?? null,
      priceWithDelta: Number(p.basePrice) + Number(variant?.priceDelta ?? 0),
      reviewCount: p.reviews.length,
      avgRating,
      hasCustomizations: customizationGroups.length > 0,
      customizationGroups,
      isWishlisted: savedProductIds.has(p.id),
      audioUrl: p.audioUrl ?? null,
      model3dUrl: p.model3dUrl ?? null,
      imageWidth: p.imageWidth ?? null,
      imageHeight: p.imageHeight ?? null,
      reviews: p.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reviewerLabel: r.user.fullName ?? "Verified buyer",
      })),
    };
  });

  // Include products that have an image OR a 3D model.
  // Products with only a 3D model get a generated placeholder thumbnail for the dome tile.
  const galleryImages: { src: string; alt: string; width?: number; height?: number }[] = [];
  const galleryProducts: ProductData[] = [];

  products.forEach((p, i) => {
    const variantSrc = p.variants[0]?.imageUrl;
    const src = variantSrc || p.imageUrl
      || (p.model3dUrl ? `https://placehold.co/800x600/111111/444444?text=${encodeURIComponent("⟳ 3D")}` : null);
    if (!src) return;
    // Only attach stored dimensions when using the product-level imageUrl (not variant images)
    const width  = !variantSrc && p.imageWidth  ? p.imageWidth  : undefined;
    const height = !variantSrc && p.imageHeight ? p.imageHeight : undefined;
    galleryImages.push({ src, alt: p.name, width, height });
    galleryProducts.push(productDataList[i]);
  });

  const theme = getTheme(sp.genre ?? "");

  return (
    <div style={{
      width: "100%", height: "calc(100vh - 4rem)", position: "relative", overflow: "hidden",
      background: theme.background,
      ["--theme-bg"            as string]: theme.background,
      ["--theme-text"          as string]: theme.text,
      ["--theme-accent"        as string]: theme.accent,
      ["--theme-accent-2"      as string]: theme.accentSecondary,
      ["--theme-card-bg"       as string]: theme.cardBackground,
      ["--theme-card-text"     as string]: theme.cardText,
      ["--theme-panel-subtext" as string]: theme.panelSubtext,
      ["--theme-glitch-a"      as string]: theme.glitchShadowA,
      ["--theme-glitch-b"      as string]: theme.glitchShadowB,
      ["--theme-font-eyebrow"  as string]: theme.fontEyebrow,
      ["--theme-font-display"  as string]: theme.fontDisplay,
      ["--theme-font-signature"as string]: theme.fontSignature,
    }}>

      {/* Dome gallery — fills entire screen */}
      {galleryImages.length > 0 ? (
        <DomeGallery
          images={galleryImages}
          overlayBlurColor={theme.background}
          grayscale={false}
          imageBorderRadius="12px"
          openedImageBorderRadius="12px"
          openedImageWidth="500px"
          openedImageHeight="500px"
          fit={1.4}
          minRadius={1800}
          segments={35}
          cardPalettes={theme.cardPalettes}
          titleAnimation={theme.titleAnimation}
          products={galleryProducts}
          userId={userId}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: theme.text, opacity: 0.4 }}>
            <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎸</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {products.length > 0 ? "No products have images yet" : "No products yet"}
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.4rem", opacity: 0.7 }}>
              {products.length > 0 ? "Add images in the admin panel to see them here" : "Check back soon"}
            </p>
          </div>
        </div>
      )}

      {/* Search + genre pills — fixed above dome, offset below the 4rem sticky nav */}
      <div style={{ position: "fixed", top: "4rem", left: 0, right: 0, zIndex: 9998 }}>
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-10">

          <ShopSearchBar
            defaultValue={sp.q ?? ""}
            hiddenFields={{
              ...(sp.category ? { category: sp.category } : {}),
              ...(sp.brand    ? { brand:    sp.brand    } : {}),
              ...(sp.sort     ? { sort:     sp.sort     } : {}),
              ...(sp.genre    ? { genre:    sp.genre    } : {}),
            }}
          />

          <div className="flex justify-center flex-wrap gap-2">
            {[
              { label: "Hip-Hop",    genre: "HIP_HOP",      color: "#FF3B1F", text: "#000"    },
              { label: "Classical",  genre: "CLASSICAL",     color: "#6B1F2A", text: "#FAF7F0" },
              { label: "Jazz",       genre: "JAZZ",          color: "#D98E2B", text: "#000"    },
              { label: "Rock/Metal", genre: "ROCK_METAL",    color: "#A11D1D", text: "#EDEDED" },
              { label: "EDM",        genre: "ELECTRONIC",    color: "#7B2FF7", text: "#fff"    },
              { label: "Folk",       genre: "COUNTRY_FOLK",  color: "#E8C77E", text: "#000"    },
              { label: "Reggae",     genre: "REGGAE",        color: "#1E7A34", text: "#F2C230" },
              { label: "Blues/Soul", genre: "BLUES_SOUL",    color: "#22314A", text: "#B97D82" },
            ].map((g) => {
              const isActive = sp.genre === g.genre;
              return (
                <a
                  key={g.label}
                  href={isActive ? "/shop" : `/shop?genre=${g.genre}`}
                  style={{ backgroundColor: g.color, color: g.text, outline: isActive ? `3px solid ${g.text}` : "none", outlineOffset: 2 }}
                  className="py-2 px-6 text-xs font-black uppercase tracking-widest rounded-full whitespace-nowrap hover:scale-105 hover:brightness-125 active:scale-95 transition-all duration-200"
                >
                  {g.label}
                </a>
              );
            })}
          </div>

        </div>
      </div>

      {/* Admin floating buttons — plain <a> tags so they always work */}
      {isAdmin && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem",
          display: "flex", flexDirection: "column", gap: "0.75rem",
          zIndex: 9999,
        }}>
          <a
            href="/admin/products/new"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "#FFD600", color: "#0a0a0a",
              borderRadius: "999px",
              fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.02em",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Add product
          </a>
          <a
            href="/admin/products"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.1rem",
              background: "rgba(0,0,0,0.7)", color: "#aaa",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "999px",
              fontWeight: 600, fontSize: "0.8rem",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ⚙ Admin panel
          </a>
        </div>
      )}

    </div>
  );
}
