"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export async function register(_prev: unknown, formData: FormData): Promise<string | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) return "All fields are required.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "An account with that email already exists.";

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, fullName, passwordHash } });
  await prisma.loyaltyAccount.create({ data: { userId: user.id } });

  redirect("/login?registered=1");
}

export async function login(_prev: unknown, formData: FormData): Promise<string | undefined> {
  const redirectTo = (formData.get("redirectTo") as string | null) || "/shop";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error;
  }
}
