import { prisma } from "@/lib/prisma";
import type { ReviewTagValue } from "@/lib/review-tags";

export type SkinRankingSort = "quality" | "value" | "wishlist_count";

export type SkinRankingOptions = {
  sortBy?: SkinRankingSort;
  weaponId?: string;
  tag?: ReviewTagValue;
  limit?: number;
};

// Reusable, parameterized aggregate query behind any current or future
// "top skins" list (e.g. a "Best Value Skins" page per SPEC.md section 16).
// Not called from a page yet — the point is that a future ranking page
// becomes "call this function, add a title," not a rewrite of one-off
// sorting logic embedded in a component.
export async function getRankedSkins({
  sortBy = "value",
  weaponId,
  tag,
  limit,
}: SkinRankingOptions = {}) {
  const skins = await prisma.skin.findMany({
    where: {
      weaponId,
      ...(tag ? { reviews: { some: { tags: { some: { tag } } } } } : {}),
    },
    include: {
      weapon: true,
      contentTier: true,
      reviews: { select: { qualityScore: true, valueScore: true } },
      _count: { select: { wishlistedBy: true } },
    },
  });

  const ranked = skins.map((skin) => {
    const reviewCount = skin.reviews.length;
    const avgQualityScore = reviewCount
      ? skin.reviews.reduce((sum, r) => sum + r.qualityScore, 0) / reviewCount
      : null;
    const avgValueScore = reviewCount
      ? skin.reviews.reduce((sum, r) => sum + r.valueScore, 0) / reviewCount
      : null;

    return {
      id: skin.id,
      name: skin.name,
      imageUrl: skin.imageUrl,
      weapon: skin.weapon,
      contentTier: skin.contentTier,
      reviewCount,
      avgQualityScore,
      avgValueScore,
      wishlistCount: skin._count.wishlistedBy,
    };
  });

  ranked.sort((a, b) => {
    if (sortBy === "quality") return (b.avgQualityScore ?? -1) - (a.avgQualityScore ?? -1);
    if (sortBy === "wishlist_count") return b.wishlistCount - a.wishlistCount;
    return (b.avgValueScore ?? -1) - (a.avgValueScore ?? -1);
  });

  return limit ? ranked.slice(0, limit) : ranked;
}
