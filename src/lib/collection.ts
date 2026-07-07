import { prisma } from "@/lib/prisma";
import { getSkinPrice } from "@/lib/pricing";
import { getAvgValueScoresExcludingUser } from "@/lib/reviews";
import { getLoadoutSlots } from "@/lib/loadout";

// A user's collection value is the sum of each owned skin's resolved VP
// price (tier price, or the skin's own override) — the core aggregation the
// whole app is built around. Alongside that "face value", also compute a
// "realistic value": tier price scaled by what other owners actually think
// each skin is worth (see getAvgValueScoresExcludingUser), since a
// widely-panned skin isn't really worth its sticker price to anyone. Skins
// with no external reviews yet fall back to face value, since there's no
// signal to scale by.
export async function getOwnedSkinsWithValue(userId: string) {
  const ownedSkins = await prisma.userOwnedSkin.findMany({
    where: { userId },
    include: {
      skin: { include: { weapon: true, contentTier: true, skinLine: true } },
      chroma: true,
    },
    orderBy: { addedAt: "desc" },
  });

  const totalValue = ownedSkins.reduce(
    (sum, owned) => sum + getSkinPrice(owned.skin),
    0
  );

  const skinIds = ownedSkins.map((owned) => owned.skin.id);
  const avgValueScores = await getAvgValueScoresExcludingUser(skinIds, userId);

  const realisticValue = ownedSkins.reduce((sum, owned) => {
    const { skin } = owned;
    const tierPrice = getSkinPrice(skin);

    // Many Select-tier weapon skins are earned free via the Battlepass
    // rather than bought outright, so their tier price can't be trusted as a
    // real-money estimate at all — zero them out. Melees are priced by their
    // own vpPriceOverride heuristic (see pricing.ts), not this tier
    // assumption, so they're excluded from this rule.
    if (skin.weapon.weaponType !== "melee" && skin.contentTier.name === "Select") {
      return sum;
    }

    const external = avgValueScores.get(skin.id);
    if (!external || external.reviewCount === 0 || external.avgValueScore === null) {
      return sum + tierPrice;
    }
    return sum + tierPrice * (external.avgValueScore / 10);
  }, 0);

  return { ownedSkins, totalValue, realisticValue: Math.round(realisticValue) };
}

// "You've reviewed X of Y owned skins" — reviews require ownership (see
// POST /api/reviews), so reviewedCount is always <= ownedCount.
export async function getCollectionProgress(userId: string) {
  const [ownedCount, reviewedCount] = await Promise.all([
    prisma.userOwnedSkin.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
  ]);
  return { ownedCount, reviewedCount };
}

// Powers the public /collection/:slug "flex" view and its Open Graph image.
// Looks up by the opt-in share slug rather than a user id, so an unshared
// collection (null slug) is simply unreachable through this path — no
// separate access check needed.
export async function getSharedCollectionBySlug(slug: string) {
  const user = await prisma.user.findUnique({ where: { collectionShareSlug: slug } });
  if (!user) return null;

  const [{ ownedSkins, totalValue, realisticValue }, loadoutSlots] = await Promise.all([
    getOwnedSkinsWithValue(user.id),
    getLoadoutSlots(user.id),
  ]);

  // "Rarest item" proxy: the highest resolved VP price in the collection.
  // A true rarity signal (e.g. a no-longer-purchasable Champions skin) would
  // need an `availability_status` field the schema doesn't track yet — price
  // is the closest thing we can derive from existing data (see section 17).
  const rarestItem = ownedSkins.reduce<(typeof ownedSkins)[number] | null>((rarest, owned) => {
    if (!rarest || getSkinPrice(owned.skin) > getSkinPrice(rarest.skin)) return owned;
    return rarest;
  }, null);

  return {
    displayName: user.displayName,
    loadoutSlots,
    collectionSize: ownedSkins.length,
    totalValue,
    realisticValue,
    rarestItem,
  };
}
