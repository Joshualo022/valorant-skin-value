import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ weaponId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { weaponId } = await params;
  const body = await request.json();
  const skinId = body.skinId as string | undefined;

  if (!skinId) {
    return NextResponse.json({ error: "skinId is required" }, { status: 400 });
  }

  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    select: { weaponId: true },
  });
  if (!skin || skin.weaponId !== weaponId) {
    return NextResponse.json({ error: "Skin does not belong to this weapon" }, { status: 400 });
  }

  // You can only equip a skin you've added in the collection builder — mirrors
  // how the in-game collection only lets you pick among skins you own.
  const owned = await prisma.userOwnedSkin.findUnique({
    where: { userId_skinId: { userId: user.id, skinId } },
  });
  if (!owned) {
    return NextResponse.json({ error: "You don't own this skin" }, { status: 403 });
  }

  const activeLoadout = await prisma.activeLoadout.upsert({
    where: { userId_weaponId: { userId: user.id, weaponId } },
    update: { skinId, chromaId: owned.chromaId },
    create: { userId: user.id, weaponId, skinId, chromaId: owned.chromaId },
  });

  return NextResponse.json({ activeLoadout });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ weaponId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { weaponId } = await params;
  await prisma.activeLoadout.deleteMany({ where: { userId: user.id, weaponId } });

  return new NextResponse(null, { status: 204 });
}
