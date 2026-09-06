"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package, MapPin, Star, Gift, Heart, Bookmark, LogOut,
} from "lucide-react";

const NAV = [
  { href: "/account/orders",       label: "Orders",       icon: Package },
  { href: "/account/addresses",    label: "Addresses",    icon: MapPin },
  { href: "/account/reviews",      label: "My Reviews",   icon: Star },
  { href: "/account/rewards",      label: "Rewards",      icon: Gift },
  { href: "/account/wishlist",     label: "Wishlist",     icon: Heart },
  { href: "/account/saved-builds", label: "Saved Builds", icon: Bookmark },
];

type Props = Readonly<{
  user: { name?: string | null; email?: string | null };
}>;

const cardBase: React.CSSProperties = {
  background: "var(--theme-card-bg)",
  border: "1px solid var(--theme-border)",
  borderRadius: 16,
};

export default function AccountSidebar({ user }: Props) {
  const pathname = usePathname();
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <div style={cardBase} className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: "var(--theme-accent)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
              {user.name ?? "Account"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--theme-panel-subtext)" }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ ...cardBase, overflow: "hidden" }}>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style={{
                borderBottom: "1px solid var(--theme-border)",
                background: active ? "rgba(255,59,31,0.1)" : "transparent",
                color: active ? "var(--theme-accent)" : "var(--theme-panel-subtext)",
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-950/40 hover:text-red-400"
          style={{ color: "var(--theme-panel-subtext)" }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </nav>
    </div>
  );
}
