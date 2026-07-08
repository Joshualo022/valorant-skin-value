// Pure data only — no Prisma import here. review-section.tsx is a client
// component that renders these; lib/reviews.ts (server-only) imports the
// value list from here too, so validation and UI can't drift apart.

export const REVIEW_TAG_VALUES = [
  "great_design",
  "clunky_design",
  "average_design",
  "great_sound",
  "weak_sound",
  "average_sound",
  "great_vfx",
  "weak_vfx",
  "average_vfx",
  "great_feel",
  "clunky_feel",
  "average_feel",
  "underrated",
  "overrated",
  "mixed_community",
] as const;

export type ReviewTagValue = (typeof REVIEW_TAG_VALUES)[number];

export type ReviewTagDimension = {
  label: string;
  left: { value: ReviewTagValue; label: string };
  middle: { value: ReviewTagValue; label: string };
  right: { value: ReviewTagValue; label: string };
};

// Each dimension is a three-way toggle — selecting one side records that tag,
// selecting neither records nothing. Order matches SPEC.md section 14.
export const REVIEW_TAG_DIMENSIONS: ReviewTagDimension[] = [
  {
    label: "Design",
    left: { value: "clunky_design", label: "Weak" },
    middle: { value: "average_design", label: "Average" },
    right: { value: "great_design", label: "Great" },
  },
  {
    label: "In-game feel",
    left: { value: "clunky_feel", label: "Weak" },
    middle: { value: "average_feel", label: "Average" },
    right: { value: "great_feel", label: "Great" },
  },
  {
    label: "Sound",
    left: { value: "weak_sound", label: "Weak" },
    middle: { value: "average_sound", label: "Average" },
    right: { value: "great_sound", label: "Great" },
  },
  {
    label: "Visual effects",
    left: { value: "weak_vfx", label: "Weak" },
    middle: { value: "average_vfx", label: "Average" },
    right: { value: "great_vfx", label: "Great" },
  },
  {
    label: "Community take",
    left: { value: "overrated", label: "Overrated" },
    middle: { value: "mixed_community", label: "Mixed" },
    right: { value: "underrated", label: "Underrated" },
  },
];

// "Great design" / "Weak design" style labels for rendering a selected tag
// as a standalone chip (e.g. in the review list), derived from the same
// dimension list so the two can't drift apart.
export const REVIEW_TAG_LABELS: Record<ReviewTagValue, string> = Object.fromEntries(
  REVIEW_TAG_DIMENSIONS.flatMap((d) => [
    [d.left.value, `${d.left.label} ${d.label.toLowerCase()}`],
    [d.middle.value, `${d.middle.label} ${d.label.toLowerCase()}`],
    [d.right.value, `${d.right.label} ${d.label.toLowerCase()}`],
  ])
) as Record<ReviewTagValue, string>;
