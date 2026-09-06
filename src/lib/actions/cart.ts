"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addToCart(variantId: string, quantity = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to add items to your cart." };

  const userId = session.user.id;

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
  }

  revalidatePath("/", "layout");
}

export async function updateCartItem(itemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeCartItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export type CartItemData = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    imageUrl: string;
    priceDelta: number;
    bodyColor: { name: string };
    pickguard: { name: string };
    hardware: { name: string };
    product: {
      id: string;
      name: string;
      basePrice: number;
      brand: { name: string };
    };
  };
};

export async function getCartItems(): Promise<{ items: CartItemData[] }> {
  const session = await auth();
  if (!session?.user?.id) return { items: [] };

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

  return { items };
}
