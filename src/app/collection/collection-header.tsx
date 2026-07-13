import Link from "next/link";
import { isVerifiedReviewer } from "@/lib/incentives";
import { VpAmount } from "@/components/vp-amount";
import { SharePopover } from "./share-panel";
import type { FullOwnedSkin } from "./all-owned-skins-grid";

// Shared chrome for both /collection tabs — "All Owned" (the full list, with
// per-weapon skin/chroma pickers) and "Loadout" (the in-game-style equipped
// grid) are two views onto the same collection, not two separate features,
// so they share one header, one value readout, and one share entry point
// rather than each page re-deriving its own.
//
// This is the editing surface's header — anything that configures
// *presentation to others* (visibility, share link, flex item) lives behind
// the Share button's popover (share-panel.tsx), not in the page body. The
// value readout follows whichever tab is active rather than an extra toggle
// of its own: one switcher (the tabs) instead of two adjacent ones
// controlling nearly the same concept.
export function CollectionHeader({
  activeTab,
  ownedCount,
  collectionValue,
  loadoutValuation,
  reviewedCount,
  collectionVisibility,
  shareSlug,
  followerCount,
  followingCount,
  origin,
  ownedSkinsForFlexItem,
  flexItemSkinId,
}: {
  activeTab: "owned" | "loadout";
  ownedCount: number;
  collectionValue: number;
  loadoutValuation: number;
  reviewedCount: number;
  collectionVisibility: "PRIVATE" | "LINK";
  shareSlug: string | null;
  followerCount: number;
  followingCount: number;
  origin: string;
  ownedSkinsForFlexItem: FullOwnedSkin[];
  flexItemSkinId: string | null;
}) {
  const progressPercent = ownedCount > 0 ? Math.round((reviewedCount / ownedCount) * 100) : 0;
  const verified = isVerifiedReviewer(reviewedCount);
  const displayedValue = activeTab === "owned" ? collectionValue : loadoutValuation;
  const valueLabel = activeTab === "owned" ? "Collection value" : "Loadout valuation";

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-display text-lg font-bold text-white">
            {ownedCount}
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold">My Collection</h1>
            <span className="text-sm text-zinc-400">
              {ownedCount} skin{ownedCount === 1 ? "" : "s"} owned
            </span>
            {shareSlug && (
              <div className="mt-0.5 flex items-center gap-3 text-xs">
                <Link href={`/u/${shareSlug}/followers`} className="text-zinc-500 hover:text-foreground">
                  <span className="font-semibold text-zinc-300">{followerCount}</span> follower
                  {followerCount === 1 ? "" : "s"}
                </Link>
                <Link href={`/u/${shareSlug}/following`} className="text-zinc-500 hover:text-foreground">
                  <span className="font-semibold text-zinc-300">{followingCount}</span> following
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {ownedCount > 0 && (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <span className="text-xs uppercase tracking-wide text-zinc-500">{valueLabel}</span>
              <VpAmount amount={displayedValue} iconSize={22} className="text-2xl text-zinc-400" />
              {activeTab === "loadout" && (
                <p className="max-w-[240px] text-right text-[11px] leading-snug text-zinc-500">
                  Estimated from other owners&apos; value ratings for skins in your active loadout —
                  Select-tier weapon skins count as 0 since many are earned free via the Battlepass
                  rather than bought.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Link
              href="/catalog"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
            >
              + Add or edit skins
            </Link>
            <SharePopover
              initialVisibility={collectionVisibility}
              initialSlug={shareSlug}
              origin={origin}
              ownedSkins={ownedSkinsForFlexItem}
              initialFlexItemSkinId={flexItemSkinId}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1 self-start rounded-full border border-border-subtle bg-surface-2 p-1 text-sm">
        <Link
          href="/collection"
          className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
            activeTab === "owned" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
          }`}
        >
          Collection
        </Link>
        <Link
          href="/collection/loadout"
          className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
            activeTab === "loadout" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
          }`}
        >
          Active Loadout
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
        <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-zinc-300">
          <span className="font-semibold text-foreground">{reviewedCount}</span>/
          <span className="font-semibold text-foreground">{ownedCount}</span> reviewed
        </span>
        {verified && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
            Verified Reviewer
          </span>
        )}
        {reviewedCount < ownedCount && (
          <Link
            href="/collection#all-owned"
            className="ml-auto shrink-0 rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Review your skins →
          </Link>
        )}
      </div>
    </>
  );
}
