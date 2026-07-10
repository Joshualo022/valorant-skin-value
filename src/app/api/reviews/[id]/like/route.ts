import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

// Single toggle endpoint rather than the wishlist's split POST/DELETE pair —
// the client only knows "the heart was tapped," not which state it's
// currently in (another tab, another device), so the route figures out
// like vs. unlike itself and reports back the resulting state.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: reviewId } = await params;
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const existingLike = await prisma.reviewLike.findUnique({
    where: { reviewId_userId: { reviewId, userId: user.id } },
  });

  if (existingLike) {
    await prisma.reviewLike.delete({ where: { id: existingLike.id } });
  } else {
    await prisma.reviewLike.create({ data: { reviewId, userId: user.id } });
    await notify({ userId: review.userId, fromUserId: user.id, type: "REVIEW_LIKED", referenceId: reviewId });
  }

  const likeCount = await prisma.reviewLike.count({ where: { reviewId } });

  return NextResponse.json({ liked: !existingLike, likeCount });
}
