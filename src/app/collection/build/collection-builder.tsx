"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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
    <div className="flex flex-col gap-4 p-6">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-black/90 py-3 backdrop-blur">
        <h1 className="text-xl font-semibold">Build your collection</h1>
        <div className="text-lg font-medium">
          Total value: <span className="text-amber-400">{totalValue.toLocaleString()} VP</span>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search skin names..."
        className="w-full max-w-sm rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weapons.map((weapon) => (
            <button
              key={weapon.id}
              onClick={() => setSelectedWeaponId(weapon.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                weapon.id === selectedWeaponId
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 text-zinc-300"
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
            className="rounded border border-zinc-700 bg-black px-2 py-1 text-zinc-200"
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
          return (
            <button
              key={skin.id}
              onClick={() => toggleOwnership(skin.id)}
              disabled={pendingSkinId === skin.id}
              className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition disabled:opacity-50 ${
                owned ? "border-amber-400 bg-amber-400/10" : "border-zinc-800"
              }`}
            >
              <div className="relative h-20 w-full">
                <Image
                  src={skin.imageUrl}
                  alt={skin.name}
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
              <div className="truncate text-sm font-medium">{skin.name}</div>
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
                {skin.contentTier.name} · {skin.contentTier.vpPrice.toLocaleString()} VP
              </div>
              <div className="text-xs font-semibold">{owned ? "Owned ✓" : "Tap to add"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
