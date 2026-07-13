import type { CharacterId } from "@/lib/avatars";

export type CharacterProps = {
  base: string;
  facet: string;
  className?: string;
};

// All six share one viewBox and one facet-line convention (thin strokes in
// a lighter shade of the same hue) so they read as one construct family —
// see AVATAR_SPEC.md §2. Silhouette is designed to survive shrinking to
// ~32px: each shape's outline itself carries the differentiation, not just
// interior detail.

function Spire({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polygon points="34,32 46,46 30,62 16,46" fill={base} />
      <polygon points="35,12 44,26 32,36 22,24" fill={base} />
      <polygon points="36,0 42,10 33,18 28,9" fill={base} />
      <g stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M34,32 30,62" />
        <path d="M35,12 32,36" />
        <path d="M36,0 33,18" />
      </g>
    </svg>
  );
}

function Orb({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="28" cy="36" r="18" fill={base} />
      <polygon points="24,20 44,8 58,26 38,40" fill={base} />
      <g stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M16,26 36,50" />
        <path d="M44,8 38,40" />
      </g>
    </svg>
  );
}

function Cluster({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polygon
        points="34,6 20,14 10,20 18,32 6,42 20,46 14,58 32,48 40,60 46,42 58,36 42,22"
        fill={base}
      />
      <g stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M34,6 40,60" />
        <path d="M10,20 58,36" />
        <path d="M6,42 46,42" />
      </g>
    </svg>
  );
}

function Prism({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polygon points="34,4 56,30 28,60 10,26" fill={base} />
      <path d="M34,4 28,60" stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Cairn({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="30" cy="47" r="15" fill={base} />
      <circle cx="35" cy="26" r="11" fill={base} />
      <circle cx="30" cy="10" r="7" fill={base} />
      <polygon points="30,0 36,8 25,9" fill={base} />
      <g stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M18,40 38,54" />
        <path d="M28,20 42,32" />
      </g>
    </svg>
  );
}

function Shatter({ base, facet, className }: CharacterProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polygon points="28,24 36,24 32,2" fill={base} />
      <polygon points="39,26 41,32 60,14" fill={base} />
      <polygon points="41,30 40,37 56,40" fill={base} />
      <polygon points="37,39 31,40 46,60" fill={base} />
      <polygon points="26,39 24,34 6,50" fill={base} />
      <polygon points="23,30 24,26 4,22" fill={base} />
      <polygon points="26,25 29,23 14,6" fill={base} />
      <circle cx="32" cy="32" r="9" fill={base} />
      <g stroke={facet} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M28,24 32,2" />
        <path d="M37,39 46,60" />
        <path d="M26,39 6,50" />
        <path d="M24,28 40,36" />
      </g>
    </svg>
  );
}

export const CHARACTER_COMPONENTS: Record<CharacterId, (props: CharacterProps) => React.JSX.Element> = {
  spire: Spire,
  orb: Orb,
  cluster: Cluster,
  prism: Prism,
  cairn: Cairn,
  shatter: Shatter,
};
