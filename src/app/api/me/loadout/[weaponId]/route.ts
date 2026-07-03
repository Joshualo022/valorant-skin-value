import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
