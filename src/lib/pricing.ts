// Single source of truth for resolving a skin's VP price. Most skins are
// priced entirely by their content tier, but melee skins in a skin line cost
// roughly 2x the tier price and need a per-skin override (see
// Skin.vpPriceOverride and prisma/seed.ts's melee override pass). Every
// place that needs a skin's price should call this instead of reading
// contentTier.vpPrice directly.
export function getSkinPrice(skin: {
  vpPriceOverride: number | null;
  contentTier: { vpPrice: number };
}): number {
  return skin.vpPriceOverride ?? skin.contentTier.vpPrice;
}
