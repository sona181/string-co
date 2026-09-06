import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReviewItemClient from "@/components/account/ReviewItemClient";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
  });

  const serialized = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    product: { id: r.product.id, name: r.product.name },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          My reviews
        </h1>
        <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>
          {reviews.length} written
        </p>
      </div>

      {serialized.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ border: "1px dashed var(--theme-border)" }}
        >
          <p className="mb-4" style={{ color: "var(--theme-panel-subtext)" }}>
            No reviews yet. Buy something and share your thoughts!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {serialized.map((review) => (
            <ReviewItemClient key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
