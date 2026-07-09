import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";

// Public — who follows this user. No auth required, same as follower counts
// shown on share pages.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    select: { follower: { select: { id: true, displayName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    follows.map(({ follower }) => ({ id: follower.id, displayName: resolveDisplayName(follower) }))
  );
}
