import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

// Single toggle endpoint, same reasoning as POST /api/reviews/:id/like — the
// client only knows "the button was tapped," not which state it's currently
// in, so the route figures out follow vs. unfollow itself and reports back
// the resulting state.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { userId: followingId } = await params;
  if (followingId === user.id) {
    return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId } },
  });

  if (existingFollow) {
    await prisma.follow.delete({ where: { id: existingFollow.id } });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId } });
    await notify({ userId: followingId, fromUserId: user.id, type: "NEW_FOLLOWER" });
  }

  const followerCount = await prisma.follow.count({ where: { followingId } });

  return NextResponse.json({ following: !existingFollow, followerCount });
}
