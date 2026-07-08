export type FullOwnedSkin = {
  skinId: string;
  name: string;
  imageUrl: string;
  vpPriceOverride: number | null;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
  weaponName: string;
  isReviewed: boolean;
};

// Shape returned by getOwnedSkinsWithValue — kept loose (rather than the
// Prisma payload type) so callers on both /collection and /collection/loadout
// can build this list from the same query without extra includes.
// `reviewedSkinIds` comes from getReviewedSkinIds — one query for the whole
// list rather than a review lookup per skin.
//
// Lives in its own plain (non "use client") module, separate from
// AllOwnedSkinsGrid, since Next.js won't let a Server Component call a
// function exported from a client-marked file at runtime — only render it
// as a component or pass it as a prop.
export function toFullOwnedSkins(
  ownedSkins: {
    skin: {
      id: string;
      name: string;
      imageUrl: string;
      vpPriceOverride: number | null;
      contentTier: { name: string; vpPrice: number; iconUrl: string };
      weapon: { name: string };
    };
  }[],
  reviewedSkinIds: Set<string>
): FullOwnedSkin[] {
  return ownedSkins.map((owned) => ({
    skinId: owned.skin.id,
    name: owned.skin.name,
    imageUrl: owned.skin.imageUrl,
    vpPriceOverride: owned.skin.vpPriceOverride,
    contentTier: owned.skin.contentTier,
    weaponName: owned.skin.weapon.name,
    isReviewed: reviewedSkinIds.has(owned.skin.id),
  }));
}
