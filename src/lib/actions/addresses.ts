"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function parseFields(formData: FormData) {
  return {
    line1: (formData.get("line1") as string)?.trim(),
    line2: (formData.get("line2") as string)?.trim() || undefined,
    city: (formData.get("city") as string)?.trim(),
    state: (formData.get("state") as string)?.trim(),
    postalCode: (formData.get("postalCode") as string)?.trim(),
    country: (formData.get("country") as string)?.trim() || "US",
  };
}

export async function createAddress(_prev: unknown, formData: FormData): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated.";

  const userId = session.user.id;
  const data = parseFields(formData);
  if (!data.line1 || !data.city || !data.state || !data.postalCode) return "Please fill in all required fields.";

  const count = await prisma.address.count({ where: { userId } });
  await prisma.address.create({ data: { ...data, userId, isDefault: count === 0 } });
  revalidatePath("/account/addresses");
}

export async function updateAddress(_prev: unknown, formData: FormData): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated.";

  const id = formData.get("id") as string;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return "Address not found.";

  const data = parseFields(formData);
  if (!data.line1 || !data.city || !data.state || !data.postalCode) return "Please fill in all required fields.";

  await prisma.address.update({ where: { id }, data });
  revalidatePath("/account/addresses");
}

export async function deleteAddress(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { id: "asc" },
    });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  await prisma.address.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
}
