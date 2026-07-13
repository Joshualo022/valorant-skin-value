"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTierStyle } from "@/lib/tier-style";
import { getSkinPrice } from "@/lib/pricing";
import { VpAmount } from "@/components/vp-amount";
import type { FullOwnedSkin } from "./owned-skins-utils";

// Re-exported so the several files that already do
// `import type { FullOwnedSkin } from "./all-owned-skins-grid"` don't need
// to change — only the runtime toFullOwnedSkins() helper had to move out
// (see owned-skins-utils.ts for why).
export type { FullOwnedSkin };

// The full flat list of owned skins, each linking to its review page. Shared
// between the Collection tab (below the per-weapon pickers) and the Loadout
// tab (so switching tabs doesn't lose access to reviewing) — both anchor it
// with id="all-owned" so the same in-page link works from either tab.
//
// Owns a local copy of the list (seeded from the allOwnedSkins prop) so a
// removed card can disappear the instant DELETE succeeds, rather than
// waiting on the router.refresh() below — that refresh still runs, to keep
// the header's owned count/collection value and the by-weapon section (which
// read the prop directly, no local copy) in sync with the removal too.
export function AllOwnedSkinsGrid({ allOwnedSkins }: { allOwnedSkins: FullOwnedSkin[] }) {
  const router = useRouter();
  const [skins, setSkins] = useState(allOwnedSkins);
  const [pendingRemoveSkinId, setPendingRemoveSkinId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRemove(skinId: string, skinName: string) {
    if (!window.confirm(`Remove ${skinName} from your collection?`)) return;

    setPendingRemoveSkinId(skinId);
    setErrorMessage(null);
    const previous = skins;
    setSkins((prev) => prev.filter((s) => s.skinId !== skinId));

    try {
      const res = await fetch(`/api/me/collection/${skinId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      router.refresh();
    } catch {
      setSkins(previous);
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingRemoveSkinId(null);
    }
  }

  return (
    <div id="all-owned" className="flex scroll-mt-32 flex-col gap-2 border-t border-border-subtle pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        All Owned Skins ({skins.length})
      </h2>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
      {skins.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You haven&apos;t added any skins yet.{" "}
          <Link href="/catalog" className="text-accent underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {skins.map((skin) => {
            const tier = getTierStyle(skin.contentTier.name);
            return (
              <div
                key={skin.skinId}
                className={`group relative flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3 transition-all hover:border-transparent ${tier.hoverRingGlow}`}
              >
                <button
                  type="button"
                  onClick={() => handleRemove(skin.skinId, skin.name)}
                  disabled={pendingRemoveSkinId === skin.skinId}
                  aria-label={`Remove ${skin.name} from collection`}
                  title="Remove from collection"
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-sm font-bold leading-none text-zinc-300 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                >
                  ✕
                </button>
                <Link href={`/skins/${skin.skinId}`} className="flex flex-col gap-2">
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
                    <VpAmount amount={getSkinPrice(skin)} className={tier.text} iconSize={14} />
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
