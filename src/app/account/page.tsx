import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, Star, Gift, Heart, Bookmark, ArrowRight } from "lucide-react";
import HalftoneReveal from "@/components/HalftoneReveal";

const TIER_CONFIG = {
  BRONZE: { label: "Bronze", min: 0,    target: 500  },
  SILVER: { label: "Silver", min: 500,  target: 2000 },
  GOLD:   { label: "Gold",   min: 2000, target: null },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, loyalty, orderCount, reviewCount, wishlistCount, buildsCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, email: true, createdAt: true } }),
    prisma.loyaltyAccount.findUnique({ where: { userId } }),
    prisma.order.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.savedProduct.count({ where: { userId } }),
    prisma.savedVariant.count({ where: { userId } }),
  ]);

  const tier = loyalty?.tier ?? "BRONZE";
  const points = loyalty?.pointsBalance ?? 0;
  const tierInfo = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  const progress = tierInfo.target
    ? Math.min(100, Math.round(((points - tierInfo.min) / (tierInfo.target - tierInfo.min)) * 100))
    : 100;

  const QUICK_LINKS = [
    { href: "/account/orders",       icon: Package,  label: "Orders",       value: orderCount,                          desc: "Track & reorder" },
    { href: "/account/addresses",    icon: MapPin,   label: "Addresses",    value: null,                                desc: "Manage saved addresses" },
    { href: "/account/reviews",      icon: Star,     label: "Reviews",      value: reviewCount,                         desc: "Your submitted reviews" },
    { href: "/account/rewards",      icon: Gift,     label: "Rewards",      value: `${points.toLocaleString()} pts`,    desc: "Redeem your points" },
    { href: "/account/wishlist",     icon: Heart,    label: "Wishlist",     value: wishlistCount,                       desc: "Saved for later" },
    { href: "/account/saved-builds", icon: Bookmark, label: "Saved Builds", value: buildsCount,                        desc: "Custom configurations" },
  ];

  const cardBase: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: 20,
  };

  return (
    <>
      {/* Fixed halftone canvas — behind page content */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <HalftoneReveal
          src="/images/cart-bg.jpg"
          inkColor="#0D0D0D"
          paperColor="#140e0c"
          dotDensity={60}
          angle={12}
          revealRadius={0.28}
          idleReveal={0.05}
          follow={0.6}
        />
      </div>

    <div className="space-y-8" style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Welcome back, {user?.fullName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--theme-panel-subtext)" }}>
          Member since {user ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : ""}
        </p>
      </div>

      {/* Loyalty card */}
      <div style={{ ...cardBase, position: "relative", overflow: "hidden" }} className="p-6">
        {/* Accent radial glow — theme-driven */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at top right, rgba(255,59,31,0.15), transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Loyalty tier
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
                {tierInfo.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Points balance
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--theme-accent)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
                {points.toLocaleString()}
              </p>
            </div>
          </div>

          {tierInfo.target ? (
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--theme-panel-subtext)" }}>
                <span>{points.toLocaleString()} pts</span>
                <span>
                  {tierInfo.target.toLocaleString()} pts to {TIER_CONFIG[tier === "BRONZE" ? "SILVER" : "GOLD"].label}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "var(--theme-accent)" }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--theme-panel-subtext)" }}>
                Earn {(tierInfo.target - points).toLocaleString()} more points to reach {TIER_CONFIG[tier === "BRONZE" ? "SILVER" : "GOLD"].label}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--theme-accent)" }}>
              Maximum tier reached — enjoy your benefits!
            </p>
          )}

          <Link
            href="/account/rewards"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-accent)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
          >
            View rewards <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick-access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map(({ href, icon: Icon, label, value, desc }) => (
          <Link
            key={href}
            href={href}
            className="block p-5 rounded-2xl transition-all group shadow-[0_0_0_1px_rgba(255,59,31,0.18)] hover:shadow-[0_0_0_1px_rgba(255,59,31,0.45)]"
            style={{ background: "var(--theme-card-bg)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity group-hover:opacity-80"
                style={{ background: "rgba(255,59,31,0.15)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--theme-accent)" }} />
              </div>
              {value !== null && (
                <span className="text-xl font-bold" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
                  {value}
                </span>
              )}
            </div>
            <p className="font-semibold text-sm" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
              {label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--theme-panel-subtext)" }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
