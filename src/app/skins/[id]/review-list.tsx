"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartButton } from "@/components/heart-button";
import { Avatar } from "@/components/avatar";
import { REVIEW_TAG_LABELS, type ReviewTagValue } from "@/lib/review-tags";
import { CommentThread } from "./comment-thread";
import type { CommentForList } from "@/lib/comments";

export type ReviewForList = {
  id: string;
  reviewerName: string;
  reviewerSlug: string | null;
  reviewerAvatarId: string | null;
  isVerifiedReviewer: boolean;
  isEarliestReview: boolean;
  qualityScore: number;
  valueScore: number;
  wouldRebuy: boolean;
  reviewText: string | null;
  createdAtLabel: string;
  editedAtLabel: string | null;
  tags: { id: string; tag: ReviewTagValue }[];
  likeCount: number;
  isLikedByViewer: boolean;
  comments: CommentForList[];
};

type SortMode = "recent" | "liked";

// Sort control + card list live together in one client component because
// sorting by like count needs to read live (optimistically-updated) like
// state, not just the counts the server sent on first load. Everything else
// about a card (name, badges, tags) is static, so those stay plain props
// computed server-side in page.tsx rather than recomputed here.
export function ReviewList({
  reviews,
  isLoggedIn,
  viewerId,
}: {
  reviews: ReviewForList[];
  isLoggedIn: boolean;
  viewerId: string | null;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [likeState, setLikeState] = useState(
    () => new Map(reviews.map((r) => [r.id, { liked: r.isLikedByViewer, count: r.likeCount }]))
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const sortedReviews = useMemo(() => {
    // "recent" keeps the server's createdAt-desc order as-is; "liked" sorts
    // by the live count so a fresh like/unlike re-sorts the list immediately.
    if (sortMode === "recent") return reviews;
    return [...reviews].sort(
      (a, b) => (likeState.get(b.id)?.count ?? 0) - (likeState.get(a.id)?.count ?? 0)
    );
  }, [reviews, sortMode, likeState]);

  async function toggleLike(reviewId: string) {
    const current = likeState.get(reviewId);
    if (!current) return;
    const wasLiked = current.liked;

    setPendingIds((ids) => new Set(ids).add(reviewId));
    setLikeState((prev) => {
      const next = new Map(prev);
      next.set(reviewId, { liked: !wasLiked, count: current.count + (wasLiked ? -1 : 1) });
      return next;
    });

    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as { liked: boolean; likeCount: number };
      setLikeState((prev) => {
        const next = new Map(prev);
        next.set(reviewId, { liked: data.liked, count: data.likeCount });
        return next;
      });
    } catch {
      setLikeState((prev) => {
        const next = new Map(prev);
        next.set(reviewId, current);
        return next;
      });
    } finally {
      setPendingIds((ids) => {
        const next = new Set(ids);
        next.delete(reviewId);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex gap-1 self-start rounded-full border border-border-subtle bg-surface-2 p-1 text-xs">
            {(["recent", "liked"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                  sortMode === mode ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
                }`}
              >
                {mode === "recent" ? "Most Recent" : "Most Liked"}
              </button>
            ))}
          </div>
        )}
      </div>

      {sortedReviews.map((review) => {
        const like = likeState.get(review.id) ?? { liked: review.isLikedByViewer, count: review.likeCount };
        return (
          <div
            key={review.id}
            id={`review-${review.id}`}
            className="flex scroll-mt-20 gap-3 rounded-2xl border border-border-subtle bg-surface p-4"
          >
            <Avatar avatarId={review.reviewerAvatarId} displayName={review.reviewerName} size="md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {review.reviewerSlug ? (
                    <Link href={`/u/${review.reviewerSlug}`} className="text-sm font-semibold hover:underline">
                      {review.reviewerName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold">{review.reviewerName}</span>
                  )}
                  {review.isVerifiedReviewer && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Verified Reviewer
                    </span>
                  )}
                  {review.isEarliestReview && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      First to review
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {review.createdAtLabel}
                    {review.editedAtLabel && (
                      <span title={`Last edited ${review.editedAtLabel}`}> · edited</span>
                    )}
                  </span>
                  <HeartButton
                    liked={like.liked}
                    count={like.count}
                    pending={pendingIds.has(review.id)}
                    isLoggedIn={isLoggedIn}
                    onToggle={() => toggleLike(review.id)}
                    subject="review"
                  />
                </div>
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
                    review.wouldRebuy ? "bg-accent/15 text-accent" : "bg-surface-2 text-zinc-400"
                  }`}
                >
                  {review.wouldRebuy ? "Would rebuy" : "Would not rebuy"}
                </span>
                {review.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full bg-surface-2 px-2 py-0.5 capitalize text-zinc-400"
                  >
                    {REVIEW_TAG_LABELS[t.tag]}
                  </span>
                ))}
              </div>
              {review.reviewText && <p className="text-sm text-zinc-300">{review.reviewText}</p>}
              <CommentThread
                reviewId={review.id}
                initialComments={review.comments}
                isLoggedIn={isLoggedIn}
                viewerId={viewerId}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
