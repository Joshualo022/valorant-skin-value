import { notFound } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSkinWithAggregateScores, getReviewsForSkin } from "@/lib/reviews";
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
      }),
    ]);
    ownsSkin = !!owned;
    existingReview = review;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative h-40 w-full shrink-0 bg-zinc-900/50 sm:w-64">
          <Image
            src={skin.imageUrl}
            alt={skin.name}
            fill
            className="object-contain"
            sizes="256px"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{skin.name}</h1>
          <div className="text-sm text-zinc-400">
            {skin.weapon.name}
            {skin.skinLine ? ` · ${skin.skinLine.name}` : ""}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
            <div className="relative h-4 w-4 shrink-0">
              <Image
                src={skin.contentTier.iconUrl}
                alt={skin.contentTier.name}
                fill
                className="object-contain"
                sizes="16px"
              />
            </div>
            {skin.contentTier.name} · {skin.contentTier.vpPrice.toLocaleString()} VP
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-lg border border-zinc-800 p-4 text-center">
        <div>
          <div className="text-2xl font-semibold">
            {avgQualityScore ? avgQualityScore.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-zinc-400">Avg Quality</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">
            {avgValueScore ? avgValueScore.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-zinc-400">Avg Value</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">
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
              }
            : null
        }
      />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{review.user.displayName}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Quality {review.qualityScore}/10 · Value {review.valueScore}/10 ·{" "}
                {review.wouldRebuy ? "Would rebuy" : "Would not rebuy"}
              </div>
              {review.reviewText && <p className="text-sm text-zinc-300">{review.reviewText}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
