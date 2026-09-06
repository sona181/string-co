"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function checkReviewEligibility(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return { loggedIn: false as const };

  const userId = session.user.id;

  const [qualifyingOrder, existingReview] = await Promise.all([
    prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        items: { some: { variant: { productId } } },
      },
      select: { id: true },
    }),
    prisma.review.findFirst({
      where: { productId, userId },
      select: { id: true, rating: true, comment: true },
    }),
  ]);

  return {
    loggedIn: true as const,
    hasQualifyingOrder: !!qualifyingOrder,
    existingReview: existingReview
      ? { id: existingReview.id, rating: existingReview.rating, comment: existingReview.comment ?? null }
      : null,
  };
}

export async function createOrUpdateReview(productId: string, rating: number, comment: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "not_logged_in" as const };

  const userId = session.user.id;

  if (rating < 1 || rating > 5) return { ok: false as const, error: "invalid_rating" as const };

  const qualifyingOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      items: { some: { variant: { productId } } },
    },
    select: { id: true },
  });

  if (!qualifyingOrder) return { ok: false as const, error: "no_qualifying_order" as const };

  const existing = await prisma.review.findFirst({ where: { productId, userId } });

  const data = { rating, comment: comment.trim() || null };
  const include = { user: { select: { fullName: true } } } as const;

  const review = existing
    ? await prisma.review.update({ where: { id: existing.id }, data, include })
    : await prisma.review.create({
        data: { productId, userId, orderId: qualifyingOrder.id, ...data },
        include,
      });

  return {
    ok: true as const,
    review: {
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: review.createdAt.toISOString(),
      reviewerLabel: review.user.fullName ?? "Verified buyer",
    },
  };
}
