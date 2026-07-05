import { prisma } from "@/lib/prisma";

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

export async function getReviewsForSkin(skinId: string) {
  // _count.reviews is the reviewer's total review count across every skin
  // (not just this one) — used to compute the "Verified Reviewer" badge
  // without a separate query per reviewer.
  return prisma.review.findMany({
    where: { skinId },
    include: {
      user: { select: { displayName: true, _count: { select: { reviews: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function validateReviewInput(body: {
  qualityScore?: unknown;
  valueScore?: unknown;
  wouldRebuy?: unknown;
  reviewText?: unknown;
}): string | null {
  const { qualityScore, valueScore, wouldRebuy } = body;

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
  return null;
}
