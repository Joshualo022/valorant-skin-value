// The curated Avatar Character System: 6 original characters x 5 colors = 30
// selectable avatarId values, format "{character}-{color}". No uploads —
// this is the entire set, ever. See AVATAR_SPEC.md.
export const CHARACTER_IDS = ["spire", "orb", "cluster", "prism", "cairn", "shatter"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const CHARACTER_LABELS: Record<CharacterId, string> = {
  spire: "Spire",
  orb: "Orb",
  cluster: "Cluster",
  prism: "Prism",
  cairn: "Cairn",
  shatter: "Shatter",
};

// Reuses the exact hex values already used for tier borders/rings elsewhere
// on the site (see src/lib/tier-style.ts) rather than inventing new hues —
// avatar colors are plain-named (never tier names) but drawn from the same
// palette so they read as part of one visual language. Colors are cosmetic
// only: not earned, not tied to collection rarity, and imply no status.
export const COLOR_IDS = ["gray", "blue", "purple", "pink", "gold"] as const;
export type ColorId = (typeof COLOR_IDS)[number];

export type AvatarColor = { id: ColorId; label: string; base: string; facet: string };

export const AVATAR_COLORS: Record<ColorId, AvatarColor> = {
  gray: { id: "gray", label: "Gray", base: "#a1a1aa", facet: "#d4d4d8" },
  blue: { id: "blue", label: "Blue", base: "#38bdf8", facet: "#7dd3fc" },
  purple: { id: "purple", label: "Purple", base: "#c084fc", facet: "#e9d5ff" },
  pink: { id: "pink", label: "Pink", base: "#f472b6", facet: "#f9a8d4" },
  gold: { id: "gold", label: "Gold", base: "#fcd34d", facet: "#fde68a" },
};

export type AvatarId = `${CharacterId}-${ColorId}`;

export const ALL_AVATAR_IDS: AvatarId[] = CHARACTER_IDS.flatMap((character) =>
  COLOR_IDS.map((color) => `${character}-${color}` as AvatarId)
);

const AVATAR_ID_SET = new Set<string>(ALL_AVATAR_IDS);

export function isValidAvatarId(id: string): id is AvatarId {
  return AVATAR_ID_SET.has(id);
}

export function parseAvatarId(id: string): { character: CharacterId; color: AvatarColor } | null {
  if (!isValidAvatarId(id)) return null;
  const [character, color] = id.split("-") as [CharacterId, ColorId];
  return { character, color: AVATAR_COLORS[color] };
}
