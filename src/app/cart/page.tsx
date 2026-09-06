import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HalftoneReveal from "@/components/HalftoneReveal";
import CartView from "@/components/CartView";
import type { CartItemData } from "@/lib/actions/cart";

export const metadata = { title: "Your Cart — String Co." };

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { brand: true } },
              bodyColor: true,
              pickguard: true,
              hardware: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  const items: CartItemData[] = (cart?.items ?? []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      imageUrl: item.variant.imageUrl,
      priceDelta: Number(item.variant.priceDelta),
      bodyColor: { name: item.variant.bodyColor.name },
      pickguard: { name: item.variant.pickguard.name },
      hardware: { name: item.variant.hardware.name },
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        basePrice: Number(item.variant.product.basePrice),
        brand: { name: item.variant.product.brand.name },
      },
    },
  }));

  const loggedIn = !!session?.user?.email;

  // Theme vars — fixed dark palette + font vars using the default/dark theme fonts
  // (cart page has its own aesthetic, not genre-driven)
  const themeVars: React.CSSProperties = {
    ["--theme-bg"             as string]: "#0D0D0D",
    ["--theme-text"           as string]: "#F2EFE4",
    ["--theme-accent"         as string]: "#FF3B1F",
    ["--theme-card-bg"        as string]: "rgba(255,59,31,0.06)",
    ["--theme-card-text"      as string]: "#F2EFE4",
    ["--theme-panel-subtext"  as string]: "#8A8578",
    // Font vars — Wild Sewerage for eyebrow labels, Riemish for display/price
    ["--theme-font-eyebrow"   as string]: "var(--font-wild-sewerage-var), sans-serif",
    ["--theme-font-display"   as string]: "var(--font-riemish-var), sans-serif",
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", ...themeVars }}>

      {/* Fixed halftone canvas — real guitar photo with halftone dot-matrix ink effect */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <HalftoneReveal
          src="/images/cart-bg.jpg"
          inkColor="#0D0D0D"
          paperColor="#1a1512"
          dotDensity={80}
          angle={24}
          revealRadius={0.32}
          idleReveal={0.06}
          follow={0.55}
        />
      </div>

      {/* Content — above canvas */}
      <div
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "3rem 1rem 5rem",
        }}
      >
        <p style={{
          fontSize: 10, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.2em",
          color: "#FF3B1F", margin: "0 0 28px",
          fontFamily: "var(--theme-font-eyebrow, sans-serif)",
        }}>
          Your cart
        </p>

        <CartView items={items} loggedIn={loggedIn} />
      </div>
    </div>
  );
}
