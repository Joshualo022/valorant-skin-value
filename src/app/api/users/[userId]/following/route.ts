import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";

// Public — who this user follows. Mirrors GET /api/users/:userId/followers,
// just queried from the other side of the same table.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { following: { select: { id: true, displayName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    follows.map(({ following }) => ({ id: following.id, displayName: resolveDisplayName(following) }))
  );
}
