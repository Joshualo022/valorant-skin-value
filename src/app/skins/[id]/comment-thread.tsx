"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { CommentForList } from "@/lib/comments";

const MAX_LENGTH = 750;

// Collapsed by default (see SOCIAL_CONSOLIDATION_SPEC.md §3) so a review
// list with active threads stays scannable — expanding is the only way to
// see or post comments, matching the "N comments" toggle text itself.
export function CommentThread({
  reviewId,
  initialComments,
  isLoggedIn,
  viewerId,
}: {
  reviewId: string;
  initialComments: CommentForList[];
  isLoggedIn: boolean;
  viewerId: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { comment: CommentForList };
      setComments((prev) => [...prev, data.comment]);
      setDraft("");
    } catch {
      setErrorMessage("Something went wrong posting your comment — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId: string) {
    setDeletingIds((ids) => new Set(ids).add(commentId));
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setErrorMessage("Couldn't delete that comment — please try again.");
    } finally {
      setDeletingIds((ids) => {
        const next = new Set(ids);
        next.delete(commentId);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle/60 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-fit cursor-pointer items-center gap-1 text-xs font-semibold text-zinc-400 transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        {comments.length === 0 ? "Add a comment" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        <svg
          viewBox="0 0 24 24"
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 pl-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-xs">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-zinc-300">
                {comment.authorName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {comment.authorSlug ? (
                    <Link href={`/u/${comment.authorSlug}`} className="font-semibold text-zinc-200 hover:underline">
                      {comment.authorName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-zinc-200">{comment.authorName}</span>
                  )}
                  {comment.isReviewAuthor && (
                    <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                      Author
                    </span>
                  )}
                  <span className="text-zinc-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  {comment.isStale && (
                    <span className="text-zinc-600" title="Written before the review above was last edited">
                      · written before edit
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-zinc-300">{comment.body}</p>
              </div>
              {viewerId === comment.authorId && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  disabled={deletingIds.has(comment.id)}
                  className="h-fit shrink-0 cursor-pointer text-zinc-600 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          {isLoggedIn ? (
            <form onSubmit={submitComment} className="flex flex-col gap-1.5">
              <label htmlFor={`comment-${reviewId}`} className="sr-only">
                Write a comment
              </label>
              <textarea
                id={`comment-${reviewId}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={2}
                placeholder="Write a comment…"
                className="w-full resize-none rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-zinc-600 focus:border-accent/50 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-600">
                  {draft.length}/{MAX_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={submitting || draft.trim().length === 0}
                  className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-xs font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-zinc-600">
              <Link href="/login" className="underline hover:text-foreground">
                Log in
              </Link>{" "}
              to comment.
            </p>
          )}

          {errorMessage && (
            <p role="alert" className="text-xs text-red-500">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
