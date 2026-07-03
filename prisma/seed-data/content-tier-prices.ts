// Hand-maintained VP pricing per content tier (SPEC.md section 8: pricing is
// static, not pulled live). Keyed by valorant-api.com's `devName` for each
// tier, which is stable across re-syncs. Standard NA/EU weapon-skin pricing;
// update here if Riot changes tier pricing.
export const CONTENT_TIER_VP_PRICES: Record<string, number> = {
  Select: 875,
  Deluxe: 1275,
  Premium: 1775,
  Ultra: 2175,
  Exclusive: 2475,
};
