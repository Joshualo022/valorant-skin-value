import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedSkinsWithValue } from "@/lib/collection";
import { WEAPON_TYPE_LABELS, compareWeapons } from "@/lib/weapon-order";
import { LoadoutView, type OwnedSkin, type WeaponGroup } from "./loadout-view";

export default async function MyCollectionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [weapons, { ownedSkins, totalValue }, activeLoadouts] = await Promise.all([
    prisma.weapon.findMany(),
    getOwnedSkinsWithValue(user.id),
    prisma.activeLoadout.findMany({ where: { userId: user.id } }),
  ]);

  const ownedByWeaponId = new Map<string, OwnedSkin[]>();
  for (const owned of ownedSkins) {
    const entry: OwnedSkin = {
      skinId: owned.skin.id,
      name: owned.skin.name,
      imageUrl: owned.skin.imageUrl,
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

  return <LoadoutView weaponGroups={weaponGroups} totalValue={totalValue} />;
}
