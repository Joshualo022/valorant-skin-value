import Image from "next/image";
import Link from "next/link";
import { getTierStyle } from "@/lib/tier-style";
import { getSkinPrice } from "@/lib/pricing";

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

// The full flat list of owned skins, each linking to its review page. Shared
// between the Collection tab (below the per-weapon pickers) and the Loadout
// tab (so switching tabs doesn't lose access to reviewing) — both anchor it
// with id="all-owned" so the same in-page link works from either tab.
export function AllOwnedSkinsGrid({ allOwnedSkins }: { allOwnedSkins: FullOwnedSkin[] }) {
  return (
    <div id="all-owned" className="flex scroll-mt-32 flex-col gap-2 border-t border-border-subtle pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        All Owned Skins ({allOwnedSkins.length})
      </h2>
      {allOwnedSkins.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You haven&apos;t added any skins yet.{" "}
          <Link href="/catalog" className="text-accent underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {allOwnedSkins.map((skin) => {
            const tier = getTierStyle(skin.contentTier.name);
            return (
              <Link
                key={skin.skinId}
                href={`/skins/${skin.skinId}`}
                className={`group flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3 transition-all hover:border-transparent ${tier.hoverRingGlow}`}
              >
                <div className="relative h-20 w-full rounded-lg bg-surface-2">
                  <Image
                    src={skin.imageUrl}
                    alt={skin.name}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                    sizes="200px"
                  />
                </div>
                <div className="truncate text-sm font-medium">{skin.name}</div>
                <div className="text-xs text-zinc-400">{skin.weaponName}</div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <div className="relative h-3.5 w-3.5 shrink-0">
                    <Image
                      src={skin.contentTier.iconUrl}
                      alt={skin.contentTier.name}
                      fill
                      className="object-contain"
                      sizes="14px"
                    />
                  </div>
                  <span className={tier.text}>{getSkinPrice(skin).toLocaleString()} VP</span>
                </div>
                <div
                  className={
                    skin.isReviewed
                      ? "rounded-full bg-surface-2 px-2.5 py-1 text-center text-xs font-medium text-zinc-400"
                      : "rounded-full bg-gradient-to-r from-accent to-accent-strong px-2.5 py-1 text-center text-xs font-semibold text-white"
                  }
                >
                  {skin.isReviewed ? "✓ Edit Review" : "Write a Review"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
