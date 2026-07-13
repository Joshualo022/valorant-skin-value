import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";

export const COMMENT_MAX_LENGTH = 750;

export function validateCommentBody(body: unknown): string | null {
  if (typeof body !== "string" || body.trim().length === 0) {
    return "Comment can't be empty";
  }
  if (body.length > COMMENT_MAX_LENGTH) {
    return `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export type CommentForList = {
  id: string;
  authorId: string;
  authorName: string;
  authorSlug: string | null;
  isReviewAuthor: boolean;
  body: string;
  createdAt: string;
  // Render-time comparison against the parent review's editedAt (see
  // Review.editedAt in schema.prisma) — a comment written before the review
  // was last edited may be responding to text that's since changed.
  isStale: boolean;
};

// Fetched once per skin page load alongside reviews (not lazily per-review),
// same pattern as review likes — comments are cheap enough at this app's
// scale that a collapsed-by-default client toggle doesn't need its own
// round trip.
export async function getCommentsForReviews(
  reviews: { id: string; userId: string; editedAt: Date | null }[]
): Promise<Map<string, CommentForList[]>> {
  const reviewIds = reviews.map((r) => r.id);
  if (reviewIds.length === 0) return new Map();

  const reviewById = new Map(reviews.map((r) => [r.id, r]));

  const comments = await prisma.comment.findMany({
    where: { reviewId: { in: reviewIds }, deletedAt: null },
    include: { user: { select: { displayName: true, email: true, collectionShareSlug: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byReview = new Map<string, CommentForList[]>();
  for (const comment of comments) {
    const review = reviewById.get(comment.reviewId);
    if (!review) continue;

    const list = byReview.get(comment.reviewId) ?? [];
    list.push({
      id: comment.id,
      authorId: comment.userId,
      authorName: resolveDisplayName(comment.user),
      authorSlug: comment.user.collectionShareSlug,
      isReviewAuthor: comment.userId === review.userId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      isStale: !!review.editedAt && comment.createdAt < review.editedAt,
    });
    byReview.set(comment.reviewId, list);
  }

  return byReview;
}
