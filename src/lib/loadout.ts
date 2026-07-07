import { prisma } from "@/lib/prisma";
import { compareWeapons } from "@/lib/weapon-order";

export type LoadoutChroma = {
  id: string;
  name: string;
  imageUrl: string;
  swatchUrl: string;
};

export type LoadoutSlot = {
  weapon: { id: string; name: string; weaponType: string; killfeedIconUrl: string | null };
  skin: { id: string; name: string; imageUrl: string } | null;
  chroma: LoadoutChroma | null;
  // All chromas for the equipped skin, for the chroma picker — empty when no
  // skin is equipped, since there's nothing to pick a chroma for.
  chromas: LoadoutChroma[];
};

function toChroma(chroma: { id: string; name: string; imageUrl: string; swatchUrl: string | null }): LoadoutChroma {
  return {
    id: chroma.id,
    name: chroma.name,
    imageUrl: chroma.imageUrl,
    swatchUrl: chroma.swatchUrl ?? chroma.imageUrl,
  };
}

// Powers both GET /api/me/loadout and the /loadout page directly — every
// weapon gets a slot regardless of whether the user has equipped anything for
// it, ordered to match Valorant's own in-game collection screen (see
// compareWeapons).
export async function getLoadoutSlots(userId: string): Promise<LoadoutSlot[]> {
  const [weapons, activeLoadouts] = await Promise.all([
    prisma.weapon.findMany(),
    prisma.activeLoadout.findMany({
      where: { userId },
      include: { skin: { include: { chromas: true } }, chroma: true },
    }),
  ]);

  const loadoutByWeaponId = new Map(activeLoadouts.map((a) => [a.weaponId, a]));

  return [...weapons].sort(compareWeapons).map((weapon) => {
    const active = loadoutByWeaponId.get(weapon.id);
    if (!active) {
      return { weapon, skin: null, chroma: null, chromas: [] };
    }
    return {
      weapon,
      skin: { id: active.skin.id, name: active.skin.name, imageUrl: active.skin.imageUrl },
      chroma: active.chroma ? toChroma(active.chroma) : null,
      chromas: active.skin.chromas.map(toChroma),
    };
  });
}
