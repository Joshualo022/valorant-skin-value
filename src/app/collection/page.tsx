import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedSkinsWithValue, getLoadoutValuation, getCollectionProgress } from "@/lib/collection";
import { WEAPON_TYPE_LABELS, compareWeapons } from "@/lib/weapon-order";
import { CollectionHeader } from "./collection-header";
import { OwnedSkinsGrid, type OwnedSkin, type WeaponGroup } from "./owned-skins-grid";
import { toFullOwnedSkins } from "./all-owned-skins-grid";

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

  const [weapons, { ownedSkins, totalValue }, loadoutValuation, activeLoadouts, { reviewedCount }] =
    await Promise.all([
      prisma.weapon.findMany(),
      getOwnedSkinsWithValue(user.id),
      getLoadoutValuation(user.id),
      prisma.activeLoadout.findMany({ where: { userId: user.id } }),
      getCollectionProgress(user.id),
    ]);

  const allOwnedSkins = toFullOwnedSkins(ownedSkins);

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
        shareSlug={user.collectionShareSlug}
        origin={origin}
        ownedSkinsForFlexItem={allOwnedSkins}
        flexItemSkinId={user.flexItemSkinId}
      />
      <OwnedSkinsGrid weaponGroups={weaponGroups} allOwnedSkins={allOwnedSkins} />
    </div>
  );
}
