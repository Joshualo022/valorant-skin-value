import { prisma } from "@/lib/prisma";
import { getSkinPrice } from "@/lib/pricing";
import { getAvgValueScoresExcludingUser } from "@/lib/reviews";
import { getLoadoutSlots } from "@/lib/loadout";
import { resolveDisplayName } from "@/lib/user";
import { WEAPON_TYPE_LABELS, compareWeapons } from "@/lib/weapon-order";

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

// Own follower/following counts for the self-view header on /collection —
// same numbers a visitor sees on this user's /u/:slug profile, just fetched
// from the owner's side instead of via getCollectionAccess's slug lookup.
export async function getFollowCounts(userId: string) {
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followerCount, followingCount };
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

// The set of skin ids this user has already reviewed — one findMany, used to
// tell "Write a Review" from "Edit Review" on the owned-skins list
// (AllOwnedSkinsGrid) without a lookup per skin.
export async function getReviewedSkinIds(userId: string): Promise<Set<string>> {
  const reviews = await prisma.review.findMany({ where: { userId }, select: { skinId: true } });
  return new Set(reviews.map((r) => r.skinId));
}

export type CollectionAccess = {
  ownerId: string;
  displayName: string;
  visibility: "PRIVATE" | "LINK";
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  appraisalCount: number;
  isAppraised: boolean;
  isOwner: boolean;
  // Whether this viewer should see the full collection — false for PRIVATE
  // unless they're the owner, in which case the page renders a private-state
  // message instead.
  canView: boolean;
  // Drives the profile header Avatar — shown regardless of visibility, not
  // part of the gated collection content itself.
  avatarId: string | null;
};

// A cheap, slug-only lookup used to decide *whether* to render the full
// shared-collection page before paying for getSharedCollectionBySlug's
// aggregation — private and locked-out collections never need that work
// done at all.
export async function getCollectionAccess(
  slug: string,
  viewerId?: string
): Promise<CollectionAccess | null> {
  const user = await prisma.user.findUnique({
    where: { collectionShareSlug: slug },
    select: {
      id: true,
      displayName: true,
      email: true,
      collectionVisibility: true,
      avatarId: true,
      _count: { select: { followers: true, following: true, appraisalsReceived: true } },
    },
  });
  if (!user) return null;

  const isOwner = viewerId === user.id;
  const [isFollowing, isAppraised] =
    !isOwner && !!viewerId
      ? await Promise.all([
          prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          }),
          prisma.collectionAppraisal.findUnique({
            where: { fromUserId_toUserId: { fromUserId: viewerId, toUserId: user.id } },
          }),
        ]).then(([follow, appraisal]) => [!!follow, !!appraisal])
      : [false, false];

  const canView = isOwner || user.collectionVisibility === "LINK";

  return {
    ownerId: user.id,
    displayName: resolveDisplayName(user),
    visibility: user.collectionVisibility,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
    appraisalCount: user._count.appraisalsReceived,
    isAppraised,
    isOwner,
    canView,
    avatarId: user.avatarId,
  };
}

export type SharedCollectionSkin = {
  skinId: string;
  name: string;
  imageUrl: string;
  vpPriceOverride: number | null;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
  weaponName: string;
};

export type SharedCollectionWeaponGroup = {
  label: string;
  skins: SharedCollectionSkin[];
};

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

  // Grouped by weapon type only (one level, not further split per individual
  // weapon like the owner's own /collection page) for the public share
  // page's read-only "Full Collection" section below the loadout grid.
  // Sorting the flat list first with the same compareWeapons used elsewhere
  // means pushing into groups in order naturally produces the right group
  // order too, with no separate sort step needed for the groups themselves.
  const sortedOwnedSkins = [...ownedSkins].sort((a, b) =>
    compareWeapons(a.skin.weapon, b.skin.weapon)
  );
  const weaponGroups: SharedCollectionWeaponGroup[] = [];
  for (const owned of sortedOwnedSkins) {
    const label = WEAPON_TYPE_LABELS[owned.skin.weapon.weaponType] ?? owned.skin.weapon.weaponType;
    let group = weaponGroups.find((g) => g.label === label);
    if (!group) {
      group = { label, skins: [] };
      weaponGroups.push(group);
    }
    group.skins.push({
      skinId: owned.skin.id,
      name: owned.skin.name,
      imageUrl: owned.skin.imageUrl,
      vpPriceOverride: owned.skin.vpPriceOverride,
      contentTier: owned.skin.contentTier,
      weaponName: owned.skin.weapon.name,
    });
  }

  return {
    displayName: resolveDisplayName(user),
    loadoutSlots,
    collectionSize: ownedSkins.length,
    totalValue,
    loadoutValuation,
    flexItem: user.flexItemSkin,
    weaponGroups,
  };
}
