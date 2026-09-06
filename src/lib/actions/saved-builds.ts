"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveVariant(variantId: string, label?: string): Promise<{ saved: boolean } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to save builds." };

  const userId = session.user.id;
  const existing = await prisma.savedVariant.findUnique({
    where: { userId_variantId: { userId, variantId } },
  });

  if (existing) {
    if (label !== undefined) {
      await prisma.savedVariant.update({ where: { id: existing.id }, data: { label } });
      revalidatePath("/account/saved-builds");
    }
    return { saved: true };
  }

  await prisma.savedVariant.create({ data: { userId, variantId, label } });
  revalidatePath("/account/saved-builds");
  return { saved: true };
}

export async function removeSavedVariant(savedVariantId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const item = await prisma.savedVariant.findUnique({ where: { id: savedVariantId } });
  if (!item || item.userId !== session.user.id) return;

  await prisma.savedVariant.delete({ where: { id: savedVariantId } });
  revalidatePath("/account/saved-builds");
}
