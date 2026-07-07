import { prisma } from "@/lib/prisma";
import { getSkinPrice } from "@/lib/pricing";
import { getAvgValueScoresExcludingUser } from "@/lib/reviews";
import { getLoadoutSlots } from "@/lib/loadout";

type PricedSkin = {
  id: string;
  vpPriceOverride: number | null;
  contentTier: { vpPrice: number; name: string };
  weapon: { weaponType: string };
};

// Shared math behind "loadout valuation" (and formerly the collection-wide
// "realistic value"): tier price scaled by what other owners actually think
// each skin is worth (see getAvgValueScoresExcludingUser), since a
// widely-panned skin isn't really worth its sticker price to anyone. Skins
// with no external reviews yet fall back to full tier price, since there's no
// signal to scale by.
function valuateSkins(
  skins: PricedSkin[],
  avgValueScores: Map<string, { avgValueScore: number | null; reviewCount: number }>
): number {
  const total = skins.reduce((sum, skin) => {
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

  return Math.round(total);
}

// A user's collection value is the sum of each owned skin's resolved VP
// price (tier price, or the skin's own override) — the core aggregation the
// whole app is built around.
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

  return { ownedSkins, totalValue };
}

// "Loadout valuation": the same realistic-value math as collection value, but
// scoped to only the skins currently equipped in the active loadout, not the
// whole owned collection — a read on what the loadout you actually play with
// is worth, not everything sitting unused in the vault.
export async function getLoadoutValuation(userId: string): Promise<number> {
  const activeLoadouts = await prisma.activeLoadout.findMany({
    where: { userId },
    include: { skin: { include: { weapon: true, contentTier: true } } },
  });

  const skins = activeLoadouts.map((active) => active.skin);
  const avgValueScores = await getAvgValueScoresExcludingUser(
    skins.map((skin) => skin.id),
    userId
  );

  return valuateSkins(skins, avgValueScores);
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
  const user = await prisma.user.findUnique({
    where: { collectionShareSlug: slug },
    include: { flexItemSkin: { include: { weapon: true, contentTier: true } } },
  });
  if (!user) return null;

  const [{ ownedSkins, totalValue }, loadoutValuation, loadoutSlots] = await Promise.all([
    getOwnedSkinsWithValue(user.id),
    getLoadoutValuation(user.id),
    getLoadoutSlots(user.id),
  ]);

  return {
    displayName: user.displayName,
    loadoutSlots,
    collectionSize: ownedSkins.length,
    totalValue,
    loadoutValuation,
    flexItem: user.flexItemSkin,
  };
}
