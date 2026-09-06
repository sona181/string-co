import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AddressesClient from "@/components/account/AddressesClient";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  const serialized = addresses.map((a) => ({
    id: a.id,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-display, sans-serif)" }}
        >
          Addresses
        </h1>
        <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>
          {addresses.length} saved
        </p>
      </div>
      <AddressesClient addresses={serialized} />
    </div>
  );
}
