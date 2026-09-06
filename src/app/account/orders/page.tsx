import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OrderCard from "@/components/account/OrderCard";

type SearchParams = Promise<{ page?: string }>;

const PER_PAGE = 10;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        address: true,
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true } },
                bodyColor: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const serialized = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    address: o.address ? {
      line1: o.address.line1,
      city: o.address.city,
      state: o.address.state,
      postalCode: o.address.postalCode,
    } : null,
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      variant: {
        id: item.variant.id,
        imageUrl: item.variant.imageUrl,
        comboKey: item.variant.comboKey,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          brand: { name: item.variant.product.brand.name },
        },
        bodyColor: item.variant.bodyColor ? { name: item.variant.bodyColor.name } : null,
      },
    })),
  }));

  const paginationBtn: React.CSSProperties = {
    border: "1px solid var(--theme-border)",
    background: "var(--theme-card-bg)",
    color: "var(--theme-panel-subtext)",
    borderRadius: 8,
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Order history
        </h1>
        <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>
          {total} order{total !== 1 ? "s" : ""}
        </p>
      </div>

      {serialized.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ border: "1px dashed var(--theme-border)" }}
        >
          <p className="mb-4" style={{ color: "var(--theme-panel-subtext)" }}>No orders yet.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {serialized.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/account/orders?page=${page - 1}`} style={paginationBtn}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <span className="text-sm px-3" style={{ color: "var(--theme-panel-subtext)" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/account/orders?page=${page + 1}`} style={paginationBtn}>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
