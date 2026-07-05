"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTierStyle } from "@/lib/tier-style";

type SkinSummary = {
  id: string;
  name: string;
  imageUrl: string;
  weaponId: string;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
};

type Weapon = {
  id: string;
  name: string;
};

type SortOption = "name" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
];

export function CollectionBuilder({
  skins,
  weapons,
  initialOwnedSkinIds,
}: {
  skins: SkinSummary[];
  weapons: Weapon[];
  initialOwnedSkinIds: string[];
}) {
  const searchParams = useSearchParams();
  const requestedWeaponId = searchParams.get("weapon");

  const [ownedSkinIds, setOwnedSkinIds] = useState(() => new Set(initialOwnedSkinIds));
  const [selectedWeaponId, setSelectedWeaponId] = useState(
    () =>
      (requestedWeaponId && weapons.some((w) => w.id === requestedWeaponId)
        ? requestedWeaponId
        : weapons[0]?.id) ?? ""
  );
  const [pendingSkinId, setPendingSkinId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [searchQuery, setSearchQuery] = useState("");

  const skinsById = useMemo(() => new Map(skins.map((s) => [s.id, s])), [skins]);

  // Derived, not stored: recomputed from the owned-set + each skin's tier
  // price whenever ownership changes, rather than re-fetched from the server.
  const totalValue = useMemo(() => {
    let total = 0;
    for (const id of ownedSkinIds) {
      const skin = skinsById.get(id);
      if (skin) total += skin.contentTier.vpPrice;
    }
    return total;
  }, [ownedSkinIds, skinsById]);

  const visibleSkins = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = skins.filter(
      (s) => s.weaponId === selectedWeaponId && (!query || s.name.toLowerCase().includes(query))
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") return a.contentTier.vpPrice - b.contentTier.vpPrice;
      if (sortBy === "price-desc") return b.contentTier.vpPrice - a.contentTier.vpPrice;
      return a.name.localeCompare(b.name);
    });
  }, [skins, selectedWeaponId, sortBy, searchQuery]);

  async function toggleOwnership(skinId: string) {
    const isOwned = ownedSkinIds.has(skinId);
    setPendingSkinId(skinId);
    setErrorMessage(null);

    setOwnedSkinIds((prev) => {
      const next = new Set(prev);
      if (isOwned) next.delete(skinId);
      else next.add(skinId);
      return next;
    });

    try {
      const res = isOwned
        ? await fetch(`/api/me/collection/${skinId}`, { method: "DELETE" })
        : await fetch("/api/me/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
          });

      if (!res.ok) throw new Error("Request failed");
    } catch {
      // Roll back the optimistic update on failure.
      setOwnedSkinIds((prev) => {
        const next = new Set(prev);
        if (isOwned) next.add(skinId);
        else next.delete(skinId);
        return next;
      });
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingSkinId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <div className="sticky top-14 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle/80 bg-background/90 py-3 backdrop-blur-md">
        <h1 className="font-display text-xl font-bold">Build your collection</h1>
        <div className="text-lg font-medium">
          Total value:{" "}
          <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
            {totalValue.toLocaleString()} VP
          </span>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      <div className="relative w-full max-w-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search skin names..."
          className="w-full rounded-full border border-border-subtle bg-surface py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weapons.map((weapon) => (
            <button
              key={weapon.id}
              onClick={() => setSelectedWeaponId(weapon.id)}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                weapon.id === selectedWeaponId
                  ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                  : "border-border-subtle text-zinc-300 hover:bg-surface"
              }`}
            >
              {weapon.name}
            </button>
          ))}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-400">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="cursor-pointer rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleSkins.length === 0 && (
        <p className="text-sm text-zinc-500">No skins match &quot;{searchQuery}&quot;.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleSkins.map((skin) => {
          const owned = ownedSkinIds.has(skin.id);
          const tier = getTierStyle(skin.contentTier.name);
          return (
            <div
              key={skin.id}
              className={`group flex flex-col gap-2 rounded-2xl border bg-surface p-3 transition-all ${
                owned
                  ? `border-transparent ${tier.ringGlow}`
                  : "border-border-subtle hover:border-zinc-600"
              }`}
            >
              <Link href={`/skins/${skin.id}`} className="flex flex-col gap-2">
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
                  <span className={tier.text}>{skin.contentTier.name}</span> ·{" "}
                  {skin.contentTier.vpPrice.toLocaleString()} VP
                </div>
              </Link>
              <button
                onClick={() => toggleOwnership(skin.id)}
                disabled={pendingSkinId === skin.id}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors disabled:opacity-50 ${
                  owned
                    ? "bg-surface-2 text-zinc-300 hover:bg-red-500/10 hover:text-red-400"
                    : "bg-gradient-to-r from-accent to-accent-strong text-white"
                }`}
              >
                {owned ? "Owned ✓ · tap to remove" : "+ Add to collection"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
