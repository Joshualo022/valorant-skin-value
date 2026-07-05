import { notFound } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSkinWithAggregateScores, getReviewsForSkin } from "@/lib/reviews";
import { getTierStyle } from "@/lib/tier-style";
import { isVerifiedReviewer } from "@/lib/incentives";
import { REVIEW_TAG_LABELS, type ReviewTagValue } from "@/lib/review-tags";
import { ReviewSection } from "./review-section";

export default async function SkinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [result, reviews] = await Promise.all([
    getSkinWithAggregateScores(id),
    getReviewsForSkin(id),
  ]);

  if (!result) {
    notFound();
  }

  const { skin, reviewCount, avgQualityScore, avgValueScore, wouldRebuyPercent } = result;

  let ownsSkin = false;
  let existingReview = null;
  if (user) {
    const [owned, review] = await Promise.all([
      prisma.userOwnedSkin.findUnique({
        where: { userId_skinId: { userId: user.id, skinId: id } },
      }),
      prisma.review.findUnique({
        where: { userId_skinId: { userId: user.id, skinId: id } },
        include: { tags: true },
      }),
    ]);
    ownsSkin = !!owned;
    existingReview = review;
  }

  const tier = getTierStyle(skin.contentTier.name);

  // "First to review" is derived here rather than stored: whichever review
  // has the oldest createdAt among the ones we already fetched for this skin.
  const earliestReviewId = reviews.reduce<{ id: string; createdAt: Date } | null>(
    (earliest, r) => (!earliest || r.createdAt < earliest.createdAt ? r : earliest),
    null
  )?.id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:flex-row">
        <div
          className={`relative h-40 w-full shrink-0 rounded-xl bg-gradient-to-br ${tier.gradient} bg-surface-2 p-1 sm:w-64`}
        >
          <div className="relative h-full w-full rounded-lg bg-surface-2">
            <Image
              src={skin.imageUrl}
              alt={skin.name}
              fill
              className="object-contain p-3"
              sizes="256px"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold">{skin.name}</h1>
          <div className="text-sm text-zinc-400">
            {skin.weapon.name}
            {skin.skinLine ? ` · ${skin.skinLine.name}` : ""}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="relative h-4 w-4 shrink-0">
              <Image
                src={skin.contentTier.iconUrl}
                alt={skin.contentTier.name}
                fill
                className="object-contain"
                sizes="16px"
              />
            </div>
            <span className={`font-semibold ${tier.text}`}>{skin.contentTier.name}</span>
            <span className="text-zinc-400">
              · {skin.contentTier.vpPrice.toLocaleString()} VP
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border-subtle bg-surface p-4 text-center">
        <div>
          <div className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-2xl font-bold text-transparent">
            {avgQualityScore ? avgQualityScore.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-zinc-400">Avg Quality</div>
        </div>
        <div>
          <div className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-2xl font-bold text-transparent">
            {avgValueScore ? avgValueScore.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-zinc-400">Avg Value</div>
        </div>
        <div>
          <div className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-2xl font-bold text-transparent">
            {wouldRebuyPercent !== null ? `${wouldRebuyPercent}%` : "—"}
          </div>
          <div className="text-xs text-zinc-400">Would Rebuy</div>
        </div>
      </div>
      <div className="text-center text-xs text-zinc-500">
        {reviewCount} review{reviewCount === 1 ? "" : "s"}
      </div>

      <ReviewSection
        skinId={id}
        isLoggedIn={!!user}
        ownsSkin={ownsSkin}
        existingReview={
          existingReview
            ? {
                id: existingReview.id,
                qualityScore: existingReview.qualityScore,
                valueScore: existingReview.valueScore,
                wouldRebuy: existingReview.wouldRebuy,
                reviewText: existingReview.reviewText,
                tags: existingReview.tags.map((t) => t.tag),
              }
            : null
        }
      />

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex gap-3 rounded-2xl border border-border-subtle bg-surface p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-sm font-bold text-white">
                {review.user.displayName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold">{review.user.displayName}</span>
                    {isVerifiedReviewer(review.user._count.reviews) && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Verified Reviewer
                      </span>
                    )}
                    {review.id === earliestReviewId && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        First to review
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-zinc-300">
                    Quality {review.qualityScore}/10
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-zinc-300">
                    Value {review.valueScore}/10
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      review.wouldRebuy
                        ? "bg-accent/15 text-accent"
                        : "bg-surface-2 text-zinc-400"
                    }`}
                  >
                    {review.wouldRebuy ? "Would rebuy" : "Would not rebuy"}
                  </span>
                  {review.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-surface-2 px-2 py-0.5 capitalize text-zinc-400"
                    >
                      {REVIEW_TAG_LABELS[t.tag as ReviewTagValue]}
                    </span>
                  ))}
                </div>
                {review.reviewText && (
                  <p className="text-sm text-zinc-300">{review.reviewText}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
