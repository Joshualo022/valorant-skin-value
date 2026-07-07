"use client";

import { useState } from "react";
import Link from "next/link";
import { isVerifiedReviewer } from "@/lib/incentives";
import { SharePanel } from "./share-panel";

// Shared chrome for both /collection tabs — "All Owned" (the full list, with
// per-weapon skin/chroma pickers) and "Loadout" (the in-game-style equipped
// grid) are two views onto the same collection, not two separate features,
// so they share one header, one value readout, and one share panel rather
// than each page re-deriving its own.
export function CollectionHeader({
  activeTab,
  ownedCount,
  totalValue,
  realisticValue,
  reviewedCount,
  shareSlug,
  origin,
}: {
  activeTab: "owned" | "loadout";
  ownedCount: number;
  totalValue: number;
  realisticValue: number;
  reviewedCount: number;
  shareSlug: string | null;
  origin: string;
}) {
  const progressPercent = ownedCount > 0 ? Math.round((reviewedCount / ownedCount) * 100) : 0;
  const verified = isVerifiedReviewer(reviewedCount);
  const [valueView, setValueView] = useState<"face" | "realistic">("face");

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
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <div className="flex gap-1 rounded-full border border-border-subtle bg-surface-2 p-0.5 text-xs">
              <button
                onClick={() => setValueView("face")}
                className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
                  valueView === "face" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
                }`}
              >
                Face Value
              </button>
              <button
                onClick={() => setValueView("realistic")}
                className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
                  valueView === "realistic" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
                }`}
              >
                Realistic Value
              </button>
            </div>
            <div className="text-left text-lg font-medium sm:text-right">
              <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-2xl font-bold text-transparent">
                {(valueView === "face" ? totalValue : realisticValue).toLocaleString()} VP
              </span>
            </div>
            {valueView === "realistic" && (
              <p className="max-w-[240px] text-right text-[11px] leading-snug text-zinc-500">
                Estimated from other owners&apos; value ratings, not exact — Select-tier weapon skins
                count as 0 since many are earned free via the Battlepass rather than bought.
              </p>
            )}
          </div>
          <Link
            href="/catalog"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            + Add or edit skins
          </Link>
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

      <SharePanel initialSlug={shareSlug} origin={origin} />

      <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-zinc-300">
            You&apos;ve reviewed <span className="font-semibold text-foreground">{reviewedCount}</span>{" "}
            of <span className="font-semibold text-foreground">{ownedCount}</span> owned skins
          </span>
          {verified && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              Verified Reviewer
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">{reviewedCount} verified reviews written</span>
      </div>
    </>
  );
}
