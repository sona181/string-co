"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(
  productId: string,
): Promise<{ wishlisted: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { wishlisted: false, error: "not_logged_in" };

  const userId = session.user.id;
  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.savedProduct.delete({ where: { id: existing.id } });
    revalidatePath("/shop");
    return { wishlisted: false };
  }

  await prisma.savedProduct.create({ data: { userId, productId } });
  revalidatePath("/shop");
  return { wishlisted: true };
}

export async function addToCart(
  variantId: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "not_logged_in" };

  const userId = session.user.id;
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: 1 } },
    create: { cartId: cart.id, variantId, quantity: 1 },
  });

  revalidatePath("/shop");
  return { ok: true, message: "added" };
}
