import { prisma } from "@/lib/prisma";
import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-concrete">Categories</h1>
        <p className="text-sm text-rust-gray mt-1">Manage product categories and subcategories.</p>
      </div>
      <AdminCategoriesClient categories={categories} />
    </div>
  );
}
