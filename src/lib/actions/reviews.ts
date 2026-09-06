"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) return;

  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath("/account/reviews");
}

export async function updateReview(_prev: unknown, formData: FormData): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated.";

  const id = formData.get("id") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = (formData.get("comment") as string)?.trim();

  if (!id || isNaN(rating) || rating < 1 || rating > 5) return "Rating must be between 1 and 5.";

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.userId !== session.user.id) return "Review not found.";

  await prisma.review.update({ where: { id }, data: { rating, comment: comment || null } });
  revalidatePath("/account/reviews");
}
