// Pure badge logic only — no Prisma import here. loadout-view.tsx is a
// client component that imports this module; pulling in @/lib/prisma (which
// drags in the `pg` driver's Node built-ins) would break the browser bundle.
// Data-fetching lives in @/lib/collection instead.
export const VERIFIED_REVIEWER_THRESHOLD = 5;

export function isVerifiedReviewer(reviewCount: number): boolean {
  return reviewCount >= VERIFIED_REVIEWER_THRESHOLD;
}
