import { prisma } from "@/lib/prisma";
import AdminBrandsClient from "@/components/admin/AdminBrandsClient";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-concrete">Brands</h1>
        <p className="text-sm text-rust-gray mt-1">Manage instrument brands.</p>
      </div>
      <AdminBrandsClient brands={brands.map(b => ({ id: b.id, name: b.name, _count: b._count }))} />
    </div>
  );
}
