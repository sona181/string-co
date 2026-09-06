import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Gift, TrendingUp, TrendingDown } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  PURCHASE:         "Purchase reward",
  REDEMPTION:       "Points redeemed",
  ADMIN_ADJUSTMENT: "Manual adjustment",
  BIRTHDAY_BONUS:   "Birthday bonus",
};

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [loyalty, rewards, transactions] = await Promise.all([
    prisma.loyaltyAccount.findUnique({ where: { userId } }),
    prisma.loyaltyReward.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } }),
    prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const points = loyalty?.pointsBalance ?? 0;

  const cardBase: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: 16,
  };

  const sectionHeading: React.CSSProperties = {
    color: "var(--theme-text)",
    fontFamily: "var(--theme-font-eyebrow, sans-serif)",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Rewards
        </h1>
        <p className="text-sm font-semibold" style={{ color: "var(--theme-accent)", fontFamily: "var(--theme-font-display, sans-serif)" }}>
          {points.toLocaleString()} pts available
        </p>
      </div>

      {/* Available rewards */}
      <div>
        <p style={sectionHeading}>Available rewards</p>
        {rewards.length === 0 ? (
          <p
            className="text-sm text-center py-8 rounded-2xl"
            style={{ color: "var(--theme-panel-subtext)", border: "1px dashed var(--theme-border)" }}
          >
            No rewards available right now — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const canAfford = points >= reward.pointsCost;
              return (
                <div
                  key={reward.id}
                  style={{
                    ...cardBase,
                    padding: "20px",
                    border: `1px solid ${canAfford ? "rgba(255,59,31,0.4)" : "var(--theme-border)"}`,
                    opacity: canAfford ? 1 : 0.55,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,59,31,0.15)" }}
                    >
                      <Gift className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--theme-accent)", fontFamily: "var(--theme-font-display, sans-serif)" }}
                    >
                      {reward.pointsCost.toLocaleString()} pts
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "var(--theme-text)" }}>
                    {reward.name}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--theme-panel-subtext)" }}>
                    {reward.description}
                  </p>
                  <button
                    disabled={!canAfford}
                    className="mt-3 w-full text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--theme-accent)",
                      color: "#fff",
                      fontFamily: "var(--theme-font-eyebrow, sans-serif)",
                    }}
                  >
                    {canAfford ? "Redeem" : `Need ${(reward.pointsCost - points).toLocaleString()} more pts`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <p style={sectionHeading}>Points history</p>
        {transactions.length === 0 ? (
          <p
            className="text-sm text-center py-8 rounded-2xl"
            style={{ color: "var(--theme-panel-subtext)", border: "1px dashed var(--theme-border)" }}
          >
            No transactions yet — earn points by placing orders.
          </p>
        ) : (
          <div style={{ ...cardBase, overflow: "hidden" }}>
            {transactions.map((tx, i) => {
              const positive = tx.pointsDelta > 0;
              const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              });
              // Semantic earn/redeem colors — muted dark tones readable across all 8 genre themes
              const iconBg    = positive ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.12)";
              const iconColor = positive ? "#4ade80"               : "#f87171";
              const deltaColor = positive ? "#4ade80"              : "#f87171";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--theme-border)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: iconBg }}
                    >
                      {positive
                        ? <TrendingUp className="w-3.5 h-3.5" style={{ color: iconColor }} />
                        : <TrendingDown className="w-3.5 h-3.5" style={{ color: iconColor }} />}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: "var(--theme-text)" }}>
                        {REASON_LABELS[tx.reason] ?? tx.reason}
                      </p>
                      <p className="text-xs" style={{ color: "var(--theme-panel-subtext)" }}>{date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: deltaColor }}>
                    {positive ? "+" : ""}{tx.pointsDelta.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
