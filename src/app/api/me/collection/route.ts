import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedSkinsWithValue } from "@/lib/collection";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ownedSkins, totalValue } = await getOwnedSkinsWithValue(user.id);
  return NextResponse.json({ ownedSkins, totalValue });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const skinId = body.skinId as string | undefined;
  const chromaId = (body.chromaId as string | undefined) ?? null;

  if (!skinId) {
    return NextResponse.json({ error: "skinId is required" }, { status: 400 });
  }

  const skin = await prisma.skin.findUnique({ where: { id: skinId }, select: { id: true } });
  if (!skin) {
    return NextResponse.json({ error: "Skin not found" }, { status: 404 });
  }

  // Mirrors PUT /api/me/loadout/:weaponId's chroma check — without it, a
  // hand-crafted request could pair a skin with a chroma belonging to a
  // completely different skin, and that mismatched pair would later be
  // trusted unvalidated as the loadout's default chroma (see
  // `resolvedChromaId` in the loadout route).
  if (chromaId) {
    const chroma = await prisma.chroma.findUnique({
      where: { id: chromaId },
      select: { skinId: true },
    });
    if (!chroma || chroma.skinId !== skinId) {
      return NextResponse.json({ error: "Chroma does not belong to this skin" }, { status: 400 });
    }
  }

  const owned = await prisma.userOwnedSkin.upsert({
    where: { userId_skinId: { userId: user.id, skinId } },
    update: { chromaId },
    create: { userId: user.id, skinId, chromaId },
  });

  return NextResponse.json({ owned }, { status: 201 });
}
