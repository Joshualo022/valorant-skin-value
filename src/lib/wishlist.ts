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

// Powers the wishlist count shown on the skin detail page — a live
// want-count, same mechanic as a like button.
export async function getWishlistCount(skinId: string) {
  return prisma.wishlist.count({ where: { skinId } });
}
