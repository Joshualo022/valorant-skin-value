import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { validateCommentBody } from "@/lib/comments";
import { resolveDisplayName } from "@/lib/user";

// Any authenticated user can comment on any visible review, including their
// own — see SOCIAL_CONSOLIDATION_SPEC.md §3. notify() itself no-ops when
// userId === fromUserId, so commenting on your own review just skips the
// notification rather than needing a separate check here.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: reviewId } = await params;
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const requestBody = await request.json();
  const validationError = validateCommentBody(requestBody.body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { reviewId, userId: user.id, body: (requestBody.body as string).trim() },
  });

  await notify({ userId: review.userId, fromUserId: user.id, type: "REVIEW_COMMENTED", referenceId: reviewId });

  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        authorId: user.id,
        authorName: resolveDisplayName(user),
        authorSlug: user.collectionShareSlug,
        isReviewAuthor: user.id === review.userId,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        isStale: false,
      },
    },
    { status: 201 }
  );
}
