"use client";

import { useRouter } from "next/navigation";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-6.716-4.35-9.428-8.03C.888 10.61 1.2 7.36 3.6 5.6a5.5 5.5 0 0 1 7.2.7l1.2 1.2 1.2-1.2a5.5 5.5 0 0 1 7.2-.7c2.4 1.76 2.712 5.01 1.028 7.37C18.716 16.65 12 21 12 21Z" />
    </svg>
  );
}

// Valorant's own brand red (#FF4655), used deliberately instead of the app's
// pink accent — a like needs to read as its own signal, distinct from the
// tier-glow/accent color already used everywhere else (ownership rings,
// gradients, buttons). Written as literal Tailwind classes rather than an
// interpolated hex, same reasoning as tier-style.ts: Tailwind's build-time
// scanner only picks up class names that appear as real strings in source.
//
// "gold" is a second tone for the collection-appraisal heart — it needs to
// read as a distinct signal from a skin/review like, not a variant of it, so
// it gets its own color (#FFD700) rather than reusing red at lower opacity.
const TONE_CLASSES = {
  red: {
    likedInline: "border-transparent bg-[#ff4655]/15 text-[#ff4655]",
    unlikedInline: "border-border-subtle text-zinc-300 hover:border-[#ff4655]/50 hover:text-[#ff4655]",
    likedOverlay: "text-[#ff4655]",
  },
  gold: {
    likedInline: "border-transparent bg-[#ffd700]/15 text-[#ffd700]",
    unlikedInline: "border-border-subtle text-zinc-300 hover:border-[#ffd700]/50 hover:text-[#ffd700]",
    likedOverlay: "text-[#ffd700]",
  },
} as const;
const UNLIKED_OVERLAY = "text-white";

// Shared like/heart toggle — used on the catalog grid (overlay variant), the
// skin detail header, and the /wishlist ("Liked") page (both inline
// variant). Auth-gating lives here rather than in each caller: tapping while
// logged out redirects to /login instead of firing the toggle, the same
// "you need an account for this" behavior other write actions use.
export function HeartButton({
  liked,
  count,
  pending = false,
  isLoggedIn,
  onToggle,
  variant = "inline",
  className = "",
  subject = "skin",
  label: labelOverride,
  tone = "red",
}: {
  liked: boolean;
  count: number;
  pending?: boolean;
  isLoggedIn: boolean;
  onToggle: () => void;
  variant?: "inline" | "overlay";
  className?: string;
  // What's being liked — feeds the aria-label/title so it reads correctly
  // wherever this button is reused (skin detail header, review cards, etc).
  subject?: string;
  // Overrides the default "Like/Unlike this {subject}" phrasing entirely —
  // needed for the appraisal heart, where "Unlike this collection" reads
  // wrong for a toggle that isn't really a "like".
  label?: string;
  // "gold" distinguishes the collection-appraisal heart from a skin/review
  // like at a glance — see the TONE_CLASSES comment above.
  tone?: "red" | "gold";
}) {
  const router = useRouter();
  const toneClasses = TONE_CLASSES[tone];

  function handleClick(e: React.MouseEvent) {
    // Overlay variant sits inside a card that's otherwise a link to the skin
    // detail page — without this, tapping the heart would also navigate.
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    onToggle();
  }

  const label = labelOverride ?? (liked ? `Unlike this ${subject}` : `Like this ${subject}`);

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        aria-label={label}
        title={label}
        className={`flex cursor-pointer items-center gap-1 rounded-full bg-black/65 px-2 py-1 backdrop-blur-sm transition-transform hover:scale-105 disabled:opacity-60 ${
          liked ? toneClasses.likedOverlay : UNLIKED_OVERLAY
        } ${className}`}
      >
        <HeartIcon filled={liked} />
        <span className="text-xs font-semibold text-white">{count}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={label}
      title={label}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
        liked ? toneClasses.likedInline : toneClasses.unlikedInline
      } ${className}`}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
    </button>
  );
}
