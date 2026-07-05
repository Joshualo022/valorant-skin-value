// Maps each content tier to a color treatment, loosely inspired by
// Valorant's in-game rarity progression (grey -> blue -> purple -> pink ->
// gold as price/rarity climbs). These are a design choice, not scraped from
// the game's actual hex values.
//
// Every class below is written out in full, rather than built with template
// interpolation (e.g. `shadow-[...${rgb}...]`). Tailwind's build-time scanner
// greps source files for literal class-name text — it never executes this
// module — so an interpolated class name never appears as a real string
// anywhere and silently generates no CSS. ringGlow/hoverRingGlow are also a
// single arbitrary `shadow-[...]` utility rather than Tailwind's `ring`
// utility: `ring` and an arbitrary `shadow-[...]` both compile to the
// `box-shadow` property, and whichever rule wins the same-specificity
// tie-break clobbers the other instead of combining.
export type TierVisual = {
  text: string; // text color class for tier name labels
  gradient: string; // `from-x to-y` background-image gradient stop classes
  ringGlow: string; // always-on colored ring + glow, as one box-shadow utility
  hoverRingGlow: string; // same effect, applied on hover only
};

export const TIER_STYLES: Record<string, TierVisual> = {
  Select: {
    text: "text-zinc-300",
    gradient: "from-zinc-400 to-zinc-300",
    ringGlow: "shadow-[0_0_0_2px_rgba(161,161,170,0.7),0_0_24px_-4px_rgba(161,161,170,0.7)]",
    hoverRingGlow:
      "hover:shadow-[0_0_0_2px_rgba(161,161,170,0.6),0_0_24px_-4px_rgba(161,161,170,0.6)]",
  },
  Deluxe: {
    text: "text-sky-400",
    gradient: "from-sky-400 to-blue-500",
    ringGlow: "shadow-[0_0_0_2px_rgba(56,189,248,0.7),0_0_24px_-4px_rgba(56,189,248,0.7)]",
    hoverRingGlow:
      "hover:shadow-[0_0_0_2px_rgba(56,189,248,0.6),0_0_24px_-4px_rgba(56,189,248,0.6)]",
  },
  Premium: {
    text: "text-purple-400",
    gradient: "from-purple-400 to-violet-500",
    ringGlow: "shadow-[0_0_0_2px_rgba(192,132,252,0.7),0_0_24px_-4px_rgba(192,132,252,0.7)]",
    hoverRingGlow:
      "hover:shadow-[0_0_0_2px_rgba(192,132,252,0.6),0_0_24px_-4px_rgba(192,132,252,0.6)]",
  },
  Exclusive: {
    text: "text-pink-400",
    gradient: "from-pink-400 to-fuchsia-500",
    ringGlow: "shadow-[0_0_0_2px_rgba(244,114,182,0.7),0_0_24px_-4px_rgba(244,114,182,0.7)]",
    hoverRingGlow:
      "hover:shadow-[0_0_0_2px_rgba(244,114,182,0.6),0_0_24px_-4px_rgba(244,114,182,0.6)]",
  },
  Ultra: {
    text: "text-amber-400",
    gradient: "from-amber-300 to-orange-500",
    ringGlow: "shadow-[0_0_0_2px_rgba(252,211,77,0.7),0_0_24px_-4px_rgba(252,211,77,0.7)]",
    hoverRingGlow:
      "hover:shadow-[0_0_0_2px_rgba(252,211,77,0.6),0_0_24px_-4px_rgba(252,211,77,0.6)]",
  },
};

export const DEFAULT_TIER_STYLE: TierVisual = TIER_STYLES.Select;

export function getTierStyle(tierName: string): TierVisual {
  return TIER_STYLES[tierName] ?? DEFAULT_TIER_STYLE;
}
