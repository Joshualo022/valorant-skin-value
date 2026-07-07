"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTierStyle } from "@/lib/tier-style";
import { isVerifiedReviewer } from "@/lib/incentives";
import { getSkinPrice } from "@/lib/pricing";
import { SharePanel } from "./share-panel";

export type OwnedSkin = {
  skinId: string;
  name: string;
  imageUrl: string;
  vpPriceOverride: number | null;
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

export type FullOwnedSkin = OwnedSkin & { weaponName: string };

export function LoadoutView({
  weaponGroups,
  totalValue,
  realisticValue,
  allOwnedSkins,
  reviewedCount,
  shareSlug,
  origin,
}: {
  weaponGroups: WeaponGroup[];
  totalValue: number;
  realisticValue: number;
  allOwnedSkins: FullOwnedSkin[];
  reviewedCount: number;
  shareSlug: string | null;
  origin: string;
}) {
  const ownedCount = allOwnedSkins.length;
  const progressPercent = ownedCount > 0 ? Math.round((reviewedCount / ownedCount) * 100) : 0;
  const verified = isVerifiedReviewer(reviewedCount);
  const [valueView, setValueView] = useState<"face" | "realistic">("face");
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
      const res = await fetch(`/api/me/loadout/${weaponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinId }),
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
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-display text-lg font-bold text-white">
            {allOwnedSkins.length}
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold">My Collection</h1>
            <span className="text-sm text-zinc-400">
              {allOwnedSkins.length} skin{allOwnedSkins.length === 1 ? "" : "s"} owned
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

      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      <nav className="sticky top-14 z-10 -mx-6 flex gap-2 overflow-x-auto border-b border-border-subtle bg-background/85 px-6 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
        {weaponGroups.map((group) => (
          <a
            key={group.label}
            href={`#group-${group.label.toLowerCase()}`}
            className="shrink-0 rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-foreground"
          >
            {group.label}
          </a>
        ))}
        <a
          href="#all-owned"
          className="shrink-0 rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-foreground"
        >
          All Owned
        </a>
      </nav>

      <div className="flex flex-col">
        {weaponGroups.map((group) => (
          <div key={group.label} id={`group-${group.label.toLowerCase()}`} className="flex flex-col scroll-mt-32">
            <h2 className="pt-4 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {group.label}
            </h2>

            {group.weapons.map((weapon) => {
              const activeSkinId = activeSkinIdByWeaponId[weapon.id];
              const activeSkin = weapon.ownedSkins.find((s) => s.skinId === activeSkinId);
              const isExpanded = expandedWeaponId === weapon.id;

              const activeTier = activeSkin ? getTierStyle(activeSkin.contentTier.name) : null;

              return (
                <div key={weapon.id} className="border-b border-border-subtle">
                  <button
                    onClick={() => setExpandedWeaponId(isExpanded ? null : weapon.id)}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-xl py-3 text-left transition-colors hover:bg-surface"
                  >
                    <div
                      className={`relative h-14 w-24 shrink-0 rounded-lg bg-surface-2 ${
                        activeTier ? activeTier.ringGlow : ""
                      }`}
                    >
                      {activeSkin ? (
                        <Image
                          src={activeSkin.imageUrl}
                          alt={activeSkin.name}
                          fill
                          className="object-contain p-1"
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
                        <p className="w-full text-sm text-zinc-500">
                          You haven&apos;t added any skins for the {weapon.name} yet.
                        </p>
                      ) : null}
                      {weapon.ownedSkins.map((skin) => {
                        const pickTier = getTierStyle(skin.contentTier.name);
                        const isActive = skin.skinId === activeSkinId;
                        return (
                          <button
                            key={skin.skinId}
                            onClick={() =>
                              isActive ? clearSkin(weapon.id) : selectSkin(weapon.id, skin.skinId)
                            }
                            disabled={pendingWeaponId === weapon.id}
                            title={isActive ? "Tap to remove" : undefined}
                            className={`group relative flex w-24 cursor-pointer flex-col items-center gap-1 rounded-xl border bg-surface p-2 text-center transition-all disabled:opacity-50 ${
                              isActive
                                ? `border-transparent ${pickTier.ringGlow}`
                                : "border-border-subtle hover:border-zinc-600"
                            }`}
                          >
                            {isActive && (
                              <span className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white group-hover:flex">
                                ×
                              </span>
                            )}
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
                              {getSkinPrice(skin).toLocaleString()} VP
                            </div>
                          </button>
                        );
                      })}
                      <Link
                        href={`/catalog?weapon=${weapon.name.toLowerCase()}`}
                        className="flex min-h-[92px] w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-subtle p-2 text-center text-xs font-medium text-zinc-400 transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        <span aria-hidden="true" className="text-lg leading-none">
                          +
                        </span>
                        Add {weapon.name} skin
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
