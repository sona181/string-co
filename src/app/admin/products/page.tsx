import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Image as ImageIcon } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand:    { select: { name: true } },
      category: { select: { name: true } },
      _count:   { select: { variants: true } },
      variants: { take: 1, orderBy: { priceDelta: "asc" }, select: { imageUrl: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-concrete">Products</h1>
          <p className="text-sm text-rust-gray mt-1">{products.length} product{products.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tag-yellow text-asphalt text-sm font-bold hover:brightness-110 transition-all"
        >
          <Plus size={16} /> New product
        </Link>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider w-14">Image</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Brand</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">SKU</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Variants</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-rust-gray">
                  No products yet.{" "}
                  <Link href="/admin/products/new" className="text-tag-yellow underline">Add your first product →</Link>
                </td>
              </tr>
            )}
            {products.map(p => {
              const thumb = p.variants[0]?.imageUrl ?? p.imageUrl;
              const price = Number(p.basePrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
              return (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-rust-gray/40">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-concrete font-medium">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 text-rust-gray">{p.brand.name}</td>
                  <td className="px-4 py-3 text-rust-gray">{p.category.name}</td>
                  <td className="px-4 py-3 text-concrete font-mono text-xs">{price}</td>
                  <td className="px-4 py-3 text-rust-gray font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p._count.variants > 0 ? "bg-chrome-teal/15 text-chrome-teal" : "bg-white/5 text-rust-gray"}`}>
                      {p._count.variants > 0 ? `${p._count.variants} variant${p._count.variants !== 1 ? "s" : ""}` : "No variants"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <Link href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded text-tag-yellow hover:bg-tag-yellow/10 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

