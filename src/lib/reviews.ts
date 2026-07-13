import { prisma } from "@/lib/prisma";
import { REVIEW_TAG_VALUES, type ReviewTagValue } from "@/lib/review-tags";

// The core aggregation for a skin's public-facing scores: average quality
// and value scores across all reviews, plus the share of reviewers who'd
// buy it again. Computed live from the reviews table, not cached — same
// "derived, not stored" approach as the collection value calculation.
export async function getSkinWithAggregateScores(skinId: string) {
  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    include: { weapon: true, contentTier: true, skinLine: true, chromas: true },
  });
  if (!skin) return null;

  const [aggregate, wouldRebuyCount] = await Promise.all([
    prisma.review.aggregate({
      where: { skinId },
      _avg: { qualityScore: true, valueScore: true },
      _count: true,
    }),
    prisma.review.count({ where: { skinId, wouldRebuy: true } }),
  ]);

  const reviewCount = aggregate._count;

  return {
    skin,
    reviewCount,
    avgQualityScore: aggregate._avg.qualityScore,
    avgValueScore: aggregate._avg.valueScore,
    wouldRebuyPercent: reviewCount > 0 ? Math.round((wouldRebuyCount / reviewCount) * 100) : null,
  };
}

// Per-skin average value score, excluding one viewer's own review — the
// building block for "realistic value" (see src/lib/collection.ts). Grouped
// in a single query rather than one aggregate per owned skin, and excluding
// the viewer is the whole point: letting a user's own score count would let
// them inflate their own collection's valuation, the same self-serving bias
// this site exists to correct.
export async function getAvgValueScoresExcludingUser(skinIds: string[], userId: string) {
  if (skinIds.length === 0) return new Map<string, { avgValueScore: number | null; reviewCount: number }>();

  const grouped = await prisma.review.groupBy({
    by: ["skinId"],
    where: { skinId: { in: skinIds }, NOT: { userId } },
    _avg: { valueScore: true },
    _count: true,
  });

  return new Map(
    grouped.map((g) => [g.skinId, { avgValueScore: g._avg.valueScore, reviewCount: g._count }])
  );
}

// viewerId is optional (logged-out visitors still see like counts, just
// never a filled-in heart). _count.likes gives every review's like count in
// the same query via a SQL subquery — no per-review count call. The
// conditional `likes` include does the same for "did *this* viewer like it":
// filtered to viewerId's own row (at most one, thanks to the
// @@unique([reviewId, userId]) constraint), so isLikedByViewer is just
// "did that array come back non-empty."
export async function getReviewsForSkin(skinId: string, viewerId?: string) {
  // _count.reviews is the reviewer's total review count across every skin
  // (not just this one) — used to compute the "Verified Reviewer" badge
  // without a separate query per reviewer.
  const reviews = await prisma.review.findMany({
    where: { skinId },
    include: {
      user: {
        select: { displayName: true, email: true, collectionShareSlug: true, _count: { select: { reviews: true } } },
      },
      tags: true,
      _count: { select: { likes: true } },
      likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(({ _count, likes, ...review }) => ({
    ...review,
    likeCount: _count.likes,
    isLikedByViewer: viewerId ? likes.length > 0 : false,
  }));
}

// Powers the home page's "recently reviewed" carousel. `distinct: ["skinId"]`
// combined with `orderBy: createdAt desc` keeps, for each skin, only the
// newest review — so a skin reviewed twice doesn't crowd out others, and the
// list naturally reflects real recent activity rather than a stored feed.
export async function getRecentlyReviewedSkins(limit: number) {
  return prisma.review.findMany({
    distinct: ["skinId"],
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      skin: { include: { weapon: true, contentTier: true } },
      user: { select: { displayName: true, email: true } },
    },
  });
}

export function validateReviewInput(body: {
  qualityScore?: unknown;
  valueScore?: unknown;
  wouldRebuy?: unknown;
  reviewText?: unknown;
  tags?: unknown;
}): string | null {
  const { qualityScore, valueScore, wouldRebuy, tags } = body;

  if (!Number.isInteger(qualityScore) || (qualityScore as number) < 1 || (qualityScore as number) > 10) {
    return "qualityScore must be an integer from 1 to 10";
  }
  if (!Number.isInteger(valueScore) || (valueScore as number) < 1 || (valueScore as number) > 10) {
    return "valueScore must be an integer from 1 to 10";
  }
  if (typeof wouldRebuy !== "boolean") {
    return "wouldRebuy must be a boolean";
  }
  if (body.reviewText !== undefined && body.reviewText !== null && typeof body.reviewText !== "string") {
    return "reviewText must be a string";
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => REVIEW_TAG_VALUES.includes(t))) {
      return "tags must be an array of valid tag values";
    }
    if (new Set(tags).size !== tags.length) {
      return "tags must not contain duplicates";
    }
  }
  return null;
}

// Replaces a review's tag rows to match the given set — simpler than diffing,
// and tag lists are short (at most one per dimension, five dimensions).
export async function setReviewTags(reviewId: string, tags: ReviewTagValue[]) {
  await prisma.$transaction([
    prisma.reviewTag.deleteMany({ where: { reviewId } }),
    prisma.reviewTag.createMany({
      data: tags.map((tag) => ({ reviewId, tag })),
    }),
  ]);
}
