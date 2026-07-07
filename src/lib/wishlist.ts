import { prisma } from "@/lib/prisma";
import { getSkinPrice } from "@/lib/pricing";

// Mirrors getOwnedSkinsWithValue's shape — same "sum of resolved VP price"
// aggregation, just over wishlisted skins instead of owned ones. Framed
// aspirationally ("if I bought all of this") rather than retrospectively.
export async function getWishlistedSkinsWithValue(userId: string) {
  const wishlistedSkins = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      skin: { include: { weapon: true, contentTier: true, skinLine: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalValue = wishlistedSkins.reduce(
    (sum, entry) => sum + getSkinPrice(entry.skin),
    0
  );

  return { wishlistedSkins, totalValue };
}

// Powers the like count shown on the skin detail page's heart button — a
// live want-count, literally the same mechanic as a like button now.
export async function getWishlistCount(skinId: string) {
  return prisma.wishlist.count({ where: { skinId } });
}

// Batch version for the /wishlist ("Liked") page's skin cards — one
// aggregation query for every skin on the page instead of one count query
// each. Same shape as src/lib/catalog.ts's attachLikeData.
export async function getWishlistCounts(skinIds: string[]): Promise<Map<string, number>> {
  if (skinIds.length === 0) return new Map();
  const grouped = await prisma.wishlist.groupBy({
    by: ["skinId"],
    where: { skinId: { in: skinIds } },
    _count: true,
  });
  return new Map(grouped.map((g) => [g.skinId, g._count]));
}
