import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewProductClient from "./client";
import { createProductFromForm } from "@/app/actions/admin";

export default async function NewProductPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <NewProductClient
      categories={categories}
      brands={brands}
      createProduct={createProductFromForm}
    />
  );
}
