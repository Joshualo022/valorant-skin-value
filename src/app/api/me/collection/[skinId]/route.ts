import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ skinId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { skinId } = await params;
  await prisma.userOwnedSkin.deleteMany({ where: { userId: user.id, skinId } });

  return new NextResponse(null, { status: 204 });
}
