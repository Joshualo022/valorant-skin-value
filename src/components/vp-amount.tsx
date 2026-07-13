import Image from "next/image";

// Single source of truth for rendering a VP amount — same principle as
// getSkinPrice(): every place a Valorant Points figure is shown goes through
// this instead of hand-rolling "{n} VP" text. The icon is a static asset
// (public/vp-icon.png, fetched once from valorant-api.com's currencies
// endpoint — see git history), never fetched at request time. alt="VP" plus
// the numeric text keeps both screen readers and image-load failures
// meaningful.
export function VpAmount({
  amount,
  className = "",
  iconSize = 14,
}: {
  amount: number;
  className?: string;
  iconSize?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Image
        src="/vp-icon.png"
        alt="VP"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
      />
      {amount.toLocaleString()}
    </span>
  );
}
