"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTierStyle } from "@/lib/tier-style";
import { resolveDisplayName } from "@/lib/user";

const AUTO_ADVANCE_MS = 4500;

export type RecentReview = {
  id: string;
  qualityScore: number;
  valueScore: number;
  reviewText: string | null;
  user: { displayName: string | null; email: string; collectionShareSlug: string | null };
  skin: {
    id: string;
    name: string;
    imageUrl: string;
    weapon: { name: string };
    contentTier: { name: string };
  };
};

export function RecentlyReviewedCarousel({ reviews }: { reviews: RecentReview[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Same "schedule it, clean it up" shape as the debounced search input, just
  // a repeating timer instead of a one-shot one. Re-running this effect after
  // every index change (manual or automatic) means a manual click always
  // gets the full interval before the next auto-advance, instead of
  // sometimes being immediately overridden by an already-pending tick.
  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % reviews.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [isPaused, reviews.length, activeIndex]);

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 pb-16">
      <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Recently reviewed
      </h2>

      <div
        className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {reviews.map((review) => {
            const tier = getTierStyle(review.skin.contentTier.name);
            const quote =
              review.reviewText?.trim() ||
              `${review.qualityScore}/10 quality · ${review.valueScore}/10 value`;
            const reviewHref = `/skins/${review.skin.id}#review-${review.id}`;
            const reviewerHref = review.user.collectionShareSlug ? `/u/${review.user.collectionShareSlug}` : null;

            // Not itself a Link — the byline links to the reviewer's profile
            // while the rest of the card links to the review, and an <a>
            // can't contain another <a>, so those have to be siblings.
            return (
              <div
                key={review.id}
                className="flex w-full shrink-0 flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left"
              >
                <Link
                  href={reviewHref}
                  className={`relative h-28 w-40 shrink-0 rounded-xl bg-surface-2 ${tier.ringGlow}`}
                >
                  <Image
                    src={review.skin.imageUrl}
                    alt={review.skin.name}
                    fill
                    className="object-contain p-2"
                    sizes="160px"
                  />
                </Link>
                <div className="flex flex-col gap-1.5">
                  <Link href={reviewHref} className="text-xs text-zinc-500">
                    {review.skin.weapon.name} ·{" "}
                    <span className={tier.text}>{review.skin.contentTier.name}</span>
                  </Link>
                  <Link href={reviewHref} className="font-display text-lg font-bold">
                    {review.skin.name}
                  </Link>
                  <Link href={reviewHref} className="text-sm text-zinc-300">
                    &ldquo;{quote}&rdquo;
                  </Link>
                  <span className="text-xs text-zinc-500">
                    —{" "}
                    {reviewerHref ? (
                      <Link href={reviewerHref} className="hover:underline">
                        {resolveDisplayName(review.user)}
                      </Link>
                    ) : (
                      resolveDisplayName(review.user)
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {reviews.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() =>
                setActiveIndex((i) => (i - 1 + reviews.length) % reviews.length)
              }
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/70 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setActiveIndex((i) => (i + 1) % reviews.length)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/70 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {reviews.map((review, i) => (
            <button
              key={review.id}
              type="button"
              aria-label={`Show ${review.skin.name}`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-surface-2 hover:bg-zinc-600"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
