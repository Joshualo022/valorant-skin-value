"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTierStyle } from "@/lib/tier-style";
import { getSkinPrice } from "@/lib/pricing";
import { HeartButton } from "@/components/heart-button";

export type LikedSkin = {
  skinId: string;
  name: string;
  imageUrl: string;
  weaponName: string;
  vpPriceOverride: number | null;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
  likeCount: number;
};

export function WishlistView({ likedSkins }: { likedSkins: LikedSkin[] }) {
  const [skins, setSkins] = useState(likedSkins);
  const [pendingSkinId, setPendingSkinId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unliking here just calls the same DELETE the catalog's heart button
  // uses — this page and the catalog are two views over the same data, not
  // separate sources of truth (same relationship My Collection has to the
  // catalog's "owned" state).
  async function unlike(skinId: string) {
    const previous = skins;
    setPendingSkinId(skinId);
    setErrorMessage(null);
    setSkins((prev) => prev.filter((s) => s.skinId !== skinId));

    try {
      const res = await fetch(`/api/me/wishlist/${skinId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setSkins(previous);
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingSkinId(null);
    }
  }

  const currentTotal = skins.reduce((sum, s) => sum + getSkinPrice(s), 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-display text-lg font-bold text-white">
            {skins.length}
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold">Liked Skins</h1>
            <span className="text-sm text-zinc-400">
              {skins.length} skin{skins.length === 1 ? "" : "s"} liked
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="text-left text-lg font-medium sm:text-right">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Total if purchased
            </div>
            <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-2xl font-bold text-transparent">
              {currentTotal.toLocaleString()} VP
            </span>
          </div>
          <Link
            href="/catalog"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            + Browse the catalog
          </Link>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      {skins.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You haven&apos;t liked any skins yet.{" "}
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
                className={`group flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3 transition-all hover:border-transparent ${tier.hoverRingGlow}`}
              >
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
                  <div className="truncate text-sm font-medium hover:underline">{skin.name}</div>
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
                    <span className={tier.text}>
                      {getSkinPrice(skin).toLocaleString()} VP
                    </span>
                  </div>
                </Link>
                <HeartButton
                  liked
                  count={skin.likeCount}
                  pending={pendingSkinId === skin.skinId}
                  isLoggedIn
                  onToggle={() => unlike(skin.skinId)}
                  className="w-full justify-center"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
