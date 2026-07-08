// Hand-maintained overrides for skins whose valorant-api.com `displayIcon` is
// itself broken — a generic "X" placeholder image served with a 200 OK, so
// the seed script's null-check fallback never catches it. Found by diffing
// response content-length across every skin's displayIcon; each of these
// resolves to the same 14,515-byte placeholder PNG. The fix is to point at
// that skin's level-1 icon instead, which has the real weapon render.
// Keyed by valorant-api.com skin UUID (== Skin.riotContentId).
export const SKIN_IMAGE_OVERRIDES: Record<string, string> = {
  // Prime Guardian
  "2a049f35-4bcd-af25-21fd-ec942e2d5007":
    "https://media.valorant-api.com/weaponskinlevels/9336ab9d-445c-0872-a283-9f9b61a0098a/displayicon.png",
  // Sovereign Guardian
  "7122d78b-4e60-eb4d-5f65-738d7c1ce9ae":
    "https://media.valorant-api.com/weaponskinlevels/8f8f82f4-4133-82c9-50b2-3c9c67e0f9fb/displayicon.png",
  // Sovereign Marshal
  "5211efa8-4efd-09bb-6cee-72b86a8a5972":
    "https://media.valorant-api.com/weaponskinlevels/c5dd6298-4928-5d64-5cd0-7fa41ea89d81/displayicon.png",
  // Luxe Knife
  "4af88517-4949-9caa-9dda-1980f07202a4":
    "https://media.valorant-api.com/weaponskinlevels/e57317ac-4a93-50a9-30e9-93a098513fa9/displayicon.png",
};
