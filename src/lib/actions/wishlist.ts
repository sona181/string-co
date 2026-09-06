"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(productId: string): Promise<{ saved: boolean } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to save items." };

  const userId = session.user.id;
  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.savedProduct.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { saved: false };
  }

  await prisma.savedProduct.create({ data: { userId, productId } });
  revalidatePath("/account/wishlist");
  return { saved: true };
}

export async function removeFromWishlist(savedProductId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const item = await prisma.savedProduct.findUnique({ where: { id: savedProductId } });
  if (!item || item.userId !== session.user.id) return;

  await prisma.savedProduct.delete({ where: { id: savedProductId } });
  revalidatePath("/account/wishlist");
}
