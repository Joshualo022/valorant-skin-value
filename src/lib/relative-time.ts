const UNITS: { limitSeconds: number; divisorSeconds: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limitSeconds: 60, divisorSeconds: 1, unit: "second" },
  { limitSeconds: 60 * 60, divisorSeconds: 60, unit: "minute" },
  { limitSeconds: 60 * 60 * 24, divisorSeconds: 60 * 60, unit: "hour" },
  { limitSeconds: 60 * 60 * 24 * 30, divisorSeconds: 60 * 60 * 24, unit: "day" },
  { limitSeconds: 60 * 60 * 24 * 365, divisorSeconds: 60 * 60 * 24 * 30, unit: "month" },
  { limitSeconds: Infinity, divisorSeconds: 60 * 60 * 24 * 365, unit: "year" },
];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });

// "2h ago", "3d ago" etc. for the activity feed — nothing like this exists
// elsewhere in the codebase yet (reviews just use toLocaleDateString, which
// doesn't read naturally for something as recent as feed activity).
export function formatRelativeTime(date: Date): string {
  const elapsedSeconds = (Date.now() - date.getTime()) / 1000;
  if (elapsedSeconds < 30) return "just now";

  const bucket = UNITS.find((u) => elapsedSeconds < u.limitSeconds)!;
  const value = Math.floor(elapsedSeconds / bucket.divisorSeconds);
  return formatter.format(-value, bucket.unit);
}
