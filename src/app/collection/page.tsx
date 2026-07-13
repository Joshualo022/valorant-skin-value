import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getOwnedSkinsWithValue,
  getLoadoutValuation,
  getCollectionProgress,
  getReviewedSkinIds,
  getFollowCounts,
} from "@/lib/collection";
import { WEAPON_TYPE_LABELS, compareWeapons } from "@/lib/weapon-order";
import { CollectionHeader } from "./collection-header";
import { OwnedSkinsGrid, type OwnedSkin, type WeaponGroup } from "./owned-skins-grid";
import { toFullOwnedSkins } from "./owned-skins-utils";

export default async function MyCollectionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Building the absolute share link server-side (from the request's own
  // Host header) rather than reading window.location.origin client-side —
  // the server has no window, so branching render output on it would make
  // the client's first render disagree with the server-rendered HTML.
  const host = (await headers()).get("host");
  const origin = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "";

  const [
    weapons,
    { ownedSkins, totalValue },
    loadoutValuation,
    activeLoadouts,
    { reviewedCount },
    reviewedSkinIds,
    { followerCount, followingCount },
  ] = await Promise.all([
    prisma.weapon.findMany(),
    getOwnedSkinsWithValue(user.id),
    getLoadoutValuation(user.id),
    prisma.activeLoadout.findMany({ where: { userId: user.id } }),
    getCollectionProgress(user.id),
    getReviewedSkinIds(user.id),
    getFollowCounts(user.id),
  ]);

  const allOwnedSkins = toFullOwnedSkins(ownedSkins, reviewedSkinIds);

  const ownedByWeaponId = new Map<string, OwnedSkin[]>();
  for (const owned of ownedSkins) {
    const entry: OwnedSkin = {
      skinId: owned.skin.id,
      name: owned.skin.name,
      imageUrl: owned.skin.imageUrl,
      vpPriceOverride: owned.skin.vpPriceOverride,
      contentTier: owned.skin.contentTier,
    };
    const list = ownedByWeaponId.get(owned.skin.weaponId) ?? [];
    list.push(entry);
    ownedByWeaponId.set(owned.skin.weaponId, list);
  }

  const activeSkinIdByWeaponId = new Map(activeLoadouts.map((a) => [a.weaponId, a.skinId]));

  const sortedWeapons = [...weapons].sort(compareWeapons);

  const weaponGroups: WeaponGroup[] = [];
  for (const weapon of sortedWeapons) {
    const label = WEAPON_TYPE_LABELS[weapon.weaponType] ?? weapon.weaponType;
    let group = weaponGroups.find((g) => g.label === label);
    if (!group) {
      group = { label, weapons: [] };
      weaponGroups.push(group);
    }
    group.weapons.push({
      id: weapon.id,
      name: weapon.name,
      ownedSkins: ownedByWeaponId.get(weapon.id) ?? [],
      activeSkinId: activeSkinIdByWeaponId.get(weapon.id) ?? null,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <CollectionHeader
        activeTab="owned"
        ownedCount={allOwnedSkins.length}
        collectionValue={totalValue}
        loadoutValuation={loadoutValuation}
        reviewedCount={reviewedCount}
        collectionVisibility={user.collectionVisibility}
        shareSlug={user.collectionShareSlug}
        followerCount={followerCount}
        followingCount={followingCount}
        origin={origin}
        ownedSkinsForFlexItem={allOwnedSkins}
        flexItemSkinId={user.flexItemSkinId}
      />
      {allOwnedSkins.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-surface py-16 text-center">
          <p className="text-lg font-semibold">Your collection is empty</p>
          <p className="max-w-sm text-sm text-zinc-400">
            Browse the catalog and mark skins you own to start building your collection.
          </p>
          <Link
            href="/catalog"
            className="mt-2 cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
          >
            Browse Skins
          </Link>
        </div>
      ) : (
        <OwnedSkinsGrid weaponGroups={weaponGroups} allOwnedSkins={allOwnedSkins} />
      )}
    </div>
  );
}
