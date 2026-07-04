import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const activeLoadouts = await prisma.activeLoadout.findMany({
    where: { userId: user.id },
    include: { skin: { include: { contentTier: true } }, chroma: true },
  });

  return NextResponse.json({ activeLoadouts });
}
