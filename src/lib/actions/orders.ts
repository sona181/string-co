"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addToCart } from "./cart";
import { redirect } from "next/navigation";

export async function reorder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: { items: true },
  });
  if (!order) return;

  for (const item of order.items) {
    await addToCart(item.variantId, item.quantity);
  }

  redirect("/cart");
}
