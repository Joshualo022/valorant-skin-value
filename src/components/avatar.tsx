import { parseAvatarId } from "@/lib/avatars";
import { CHARACTER_COMPONENTS } from "@/components/avatars/characters";

const SIZE_CLASSES = {
  xs: { box: "h-6 w-6", text: "text-[10px]", pad: "p-0.5" },
  sm: { box: "h-8 w-8", text: "text-xs", pad: "p-1" },
  md: { box: "h-9 w-9", text: "text-sm", pad: "p-1" },
  lg: { box: "h-16 w-16", text: "text-xl", pad: "p-2" },
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

// Single source of truth for rendering a user's identity — same principle
// as getSkinPrice() and VpAmount: every place a user is represented goes
// through this, never a hand-rolled letter circle. Renders the chosen
// character SVG in the chosen color when avatarId is a known combo, or the
// original generated letter avatar otherwise (null, or a stale/invalid id).
export function Avatar({
  avatarId,
  displayName,
  size = "md",
  className = "",
}: {
  avatarId: string | null | undefined;
  displayName: string;
  size?: AvatarSize;
  className?: string;
}) {
  const { box, text, pad } = SIZE_CLASSES[size];
  const parsed = avatarId ? parseAvatarId(avatarId) : null;

  if (parsed) {
    const Character = CHARACTER_COMPONENTS[parsed.character];
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 ${box} ${pad} ${className}`}
      >
        <Character base={parsed.color.base} facet={parsed.color.facet} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-bold text-white ${box} ${text} ${className}`}
    >
      {displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
