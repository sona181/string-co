import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return Response.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name:        { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, imageUrl: true },
    take: 8,
    orderBy: { name: "asc" },
  });

  return Response.json(
    products.map(p => ({ id: p.id, text: p.name, imageUrl: p.imageUrl ?? null }))
  );
}
