import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Tag, Layers, ChevronLeft } from "lucide-react";

export const metadata = { title: "Admin — String Co." };

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-asphalt text-concrete">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0a]">
        <div className="px-5 py-5 border-b border-white/5">
          <p className="text-tag-yellow font-black text-sm uppercase tracking-widest">String Co.</p>
          <p className="text-rust-gray text-xs mt-0.5">Admin panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink href="/admin/products" icon={<Package size={15} />}>Products</NavLink>
          <NavLink href="/admin/categories" icon={<Layers size={15} />}>Categories</NavLink>
          <NavLink href="/admin/brands" icon={<Tag size={15} />}>Brands</NavLink>
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs text-rust-gray hover:text-concrete transition-colors px-2 py-1.5"
          >
            <ChevronLeft size={13} />
            Back to shop
          </Link>
          <p className="text-xs text-rust-gray/50 px-2 mt-3 truncate">{session.user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rust-gray hover:text-concrete hover:bg-white/5 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
