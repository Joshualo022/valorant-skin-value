import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ skins: [] });
  }

  const skins = await prisma.skin.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      weapon: { select: { name: true } },
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ skins });
}
