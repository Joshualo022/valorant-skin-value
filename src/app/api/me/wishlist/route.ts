import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedSkinsWithValue } from "@/lib/wishlist";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { wishlistedSkins, totalValue } = await getWishlistedSkinsWithValue(user.id);
  return NextResponse.json({ wishlistedSkins, totalValue });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const skinId = body.skinId as string | undefined;

  if (!skinId) {
    return NextResponse.json({ error: "skinId is required" }, { status: 400 });
  }

  const skin = await prisma.skin.findUnique({ where: { id: skinId }, select: { id: true } });
  if (!skin) {
    return NextResponse.json({ error: "Skin not found" }, { status: 404 });
  }

  const wishlisted = await prisma.wishlist.upsert({
    where: { userId_skinId: { userId: user.id, skinId } },
    update: {},
    create: { userId: user.id, skinId },
  });

  return NextResponse.json({ wishlisted }, { status: 201 });
}
