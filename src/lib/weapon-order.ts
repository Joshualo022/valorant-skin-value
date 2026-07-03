// Matches Valorant's own in-game order: weapon categories in the collection
// tab's order, and weapons within each category by in-match buy cost
// (ascending) — confirmed against valorant-api.com's shopData.cost, with the
// Phantom/Vandal tie (both 2900) broken to match the in-game buy menu.
export const WEAPON_TYPE_ORDER = [
  "sidearm",
  "smg",
  "shotgun",
  "rifle",
  "sniper",
  "heavy",
  "melee",
];

export const WEAPON_TYPE_LABELS: Record<string, string> = {
  sidearm: "Sidearms",
  smg: "SMGs",
  shotgun: "Shotguns",
  rifle: "Rifles",
  sniper: "Snipers",
  heavy: "Heavy",
  melee: "Melee",
};

const WEAPON_NAME_ORDER = [
  // Sidearms
  "Classic",
  "Shorty",
  "Frenzy",
  "Ghost",
  "Bandit",
  "Sheriff",
  // SMGs
  "Stinger",
  "Spectre",
  // Shotguns
  "Bucky",
  "Judge",
  // Rifles
  "Bulldog",
  "Guardian",
  "Phantom",
  "Vandal",
  // Snipers
  "Marshal",
  "Outlaw",
  "Operator",
  // Heavy
  "Ares",
  "Odin",
  // Melee
  "Melee",
];

export function compareWeapons(
  a: { name: string; weaponType: string },
  b: { name: string; weaponType: string }
) {
  const typeDiff =
    WEAPON_TYPE_ORDER.indexOf(a.weaponType) - WEAPON_TYPE_ORDER.indexOf(b.weaponType);
  if (typeDiff !== 0) return typeDiff;
  return WEAPON_NAME_ORDER.indexOf(a.name) - WEAPON_NAME_ORDER.indexOf(b.name);
}
