"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type OwnedSkin = {
  skinId: string;
  name: string;
  imageUrl: string;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
};

export type WeaponSlot = {
  id: string;
  name: string;
  ownedSkins: OwnedSkin[];
  activeSkinId: string | null;
};

export type WeaponGroup = {
  label: string;
  weapons: WeaponSlot[];
};

export function LoadoutView({
  weaponGroups,
  totalValue,
}: {
  weaponGroups: WeaponGroup[];
  totalValue: number;
}) {
  const [activeSkinIdByWeaponId, setActiveSkinIdByWeaponId] = useState<
    Record<string, string | null>
  >(() =>
    Object.fromEntries(weaponGroups.flatMap((g) => g.weapons.map((w) => [w.id, w.activeSkinId])))
  );
  const [expandedWeaponId, setExpandedWeaponId] = useState<string | null>(null);
  const [pendingWeaponId, setPendingWeaponId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function selectSkin(weaponId: string, skinId: string) {
    const previous = activeSkinIdByWeaponId[weaponId] ?? null;
    setPendingWeaponId(weaponId);
    setErrorMessage(null);
    setActiveSkinIdByWeaponId((prev) => ({ ...prev, [weaponId]: skinId }));

    try {
      const res = await fetch("/api/me/loadout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weaponId, skinId }),
      });
      if (!res.ok) throw new Error("Request failed");
      setExpandedWeaponId(null);
    } catch {
      setActiveSkinIdByWeaponId((prev) => ({ ...prev, [weaponId]: previous }));
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingWeaponId(null);
    }
  }

  async function clearSkin(weaponId: string) {
    const previous = activeSkinIdByWeaponId[weaponId] ?? null;
    setPendingWeaponId(weaponId);
    setErrorMessage(null);
    setActiveSkinIdByWeaponId((prev) => ({ ...prev, [weaponId]: null }));

    try {
      const res = await fetch(`/api/me/loadout/${weaponId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setExpandedWeaponId(null);
    } catch {
      setActiveSkinIdByWeaponId((prev) => ({ ...prev, [weaponId]: previous }));
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingWeaponId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-black/90 py-3 backdrop-blur">
        <h1 className="text-xl font-semibold">My Collection</h1>
        <div className="text-lg font-medium">
          Total value: <span className="text-amber-400">{totalValue.toLocaleString()} VP</span>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <div className="flex flex-col">
        {weaponGroups.map((group) => (
          <div key={group.label} className="flex flex-col">
            <h2 className="pt-4 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {group.label}
            </h2>

            {group.weapons.map((weapon) => {
              const activeSkinId = activeSkinIdByWeaponId[weapon.id];
              const activeSkin = weapon.ownedSkins.find((s) => s.skinId === activeSkinId);
              const isExpanded = expandedWeaponId === weapon.id;

              return (
                <div key={weapon.id} className="border-b border-zinc-800">
                  <button
                    onClick={() => setExpandedWeaponId(isExpanded ? null : weapon.id)}
                    className="flex w-full items-center gap-4 py-3 text-left"
                  >
                    <div className="relative h-14 w-24 shrink-0 bg-zinc-900/50">
                      {activeSkin ? (
                        <Image
                          src={activeSkin.imageUrl}
                          alt={activeSkin.name}
                          fill
                          className="object-contain"
                          sizes="150px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          No skin
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{weapon.name}</div>
                      <div className="text-xs text-zinc-400">
                        {activeSkin
                          ? activeSkin.name
                          : weapon.ownedSkins.length === 0
                            ? "No skins owned"
                            : "Tap to choose a skin"}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="flex flex-wrap gap-3 pb-4">
                      {weapon.ownedSkins.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          You haven&apos;t added any skins for the {weapon.name} yet.{" "}
                          <Link
                            href={`/collection/build?weapon=${weapon.id}`}
                            className="underline"
                          >
                            Add some
                          </Link>
                          .
                        </p>
                      ) : (
                        <>
                          {weapon.ownedSkins.map((skin) => (
                            <button
                              key={skin.skinId}
                              onClick={() => selectSkin(weapon.id, skin.skinId)}
                              disabled={pendingWeaponId === weapon.id}
                              className={`flex w-24 flex-col items-center gap-1 rounded border p-2 text-center disabled:opacity-50 ${
                                skin.skinId === activeSkinId
                                  ? "border-amber-400 bg-amber-400/10"
                                  : "border-zinc-800"
                              }`}
                            >
                              <div className="relative h-12 w-full">
                                <Image
                                  src={skin.imageUrl}
                                  alt={skin.name}
                                  fill
                                  className="object-contain"
                                  sizes="100px"
                                />
                              </div>
                              <div className="w-full truncate text-xs">{skin.name}</div>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                <div className="relative h-3 w-3 shrink-0">
                                  <Image
                                    src={skin.contentTier.iconUrl}
                                    alt={skin.contentTier.name}
                                    fill
                                    className="object-contain"
                                    sizes="12px"
                                  />
                                </div>
                                {skin.contentTier.vpPrice.toLocaleString()} VP
                              </div>
                            </button>
                          ))}
                          {activeSkinId && (
                            <button
                              onClick={() => clearSkin(weapon.id)}
                              disabled={pendingWeaponId === weapon.id}
                              className="w-24 rounded border border-zinc-800 p-2 text-xs text-zinc-400 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
