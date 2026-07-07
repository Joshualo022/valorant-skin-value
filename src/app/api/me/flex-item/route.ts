import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sets the showcase skin for the user's public share page. Restricted to
// owned skins — same rule as equipping a loadout slot — since flexing a skin
// you don't actually have would defeat the point.
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const skinId = body.skinId as string | undefined;
  if (!skinId) {
    return NextResponse.json({ error: "skinId is required" }, { status: 400 });
  }

  const owned = await prisma.userOwnedSkin.findUnique({
    where: { userId_skinId: { userId: user.id, skinId } },
  });
  if (!owned) {
    return NextResponse.json({ error: "You don't own this skin" }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { flexItemSkinId: skinId } });
  return NextResponse.json({ flexItemSkinId: skinId });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { flexItemSkinId: null } });
  return new NextResponse(null, { status: 204 });
}
