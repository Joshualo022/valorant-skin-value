"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ExistingReview = {
  id: string;
  qualityScore: number;
  valueScore: number;
  wouldRebuy: boolean;
  reviewText: string | null;
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export function ReviewSection({
  skinId,
  isLoggedIn,
  ownsSkin,
  existingReview,
}: {
  skinId: string;
  isLoggedIn: boolean;
  ownsSkin: boolean;
  existingReview: ExistingReview | null;
}) {
  const router = useRouter();
  const [justAdded, setJustAdded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [qualityScore, setQualityScore] = useState(existingReview?.qualityScore ?? 7);
  const [valueScore, setValueScore] = useState(existingReview?.valueScore ?? 7);
  const [wouldRebuy, setWouldRebuy] = useState(existingReview?.wouldRebuy ?? true);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText ?? "");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectivelyOwnsSkin = ownsSkin || justAdded;

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-zinc-500">
        <Link href="/login" className="text-accent underline">
          Log in
        </Link>{" "}
        to review skins you own.
      </p>
    );
  }

  async function handleAddAndReview() {
    setPending(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/me/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinId }),
      });
      if (!res.ok) throw new Error("Something went wrong");

      // Add ownership and jump straight into the review form in one click,
      // rather than sending the user to the builder and back.
      setJustAdded(true);
      setIsEditing(true);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (!effectivelyOwnsSkin) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={handleAddAndReview}
          disabled={pending}
          className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Adding..." : "Add to collection & review"}
        </button>
        {errorMessage && (
          <p role="alert" className="text-sm text-red-500">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrorMessage(null);

    try {
      const res = existingReview
        ? await fetch(`/api/reviews/${existingReview.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qualityScore, valueScore, wouldRebuy, reviewText }),
          })
        : await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId, qualityScore, valueScore, wouldRebuy, reviewText }),
          });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!existingReview) return;
    setPending(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reviews/${existingReview.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Something went wrong");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="cursor-pointer self-start rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50"
      >
        {existingReview ? "Edit your review" : "Write a review"}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-4"
    >
      <div className="flex flex-wrap gap-6">
        <label className="flex flex-col gap-1 text-sm">
          Quality
          <select
            value={qualityScore}
            onChange={(e) => setQualityScore(Number(e.target.value))}
            className="cursor-pointer rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 focus:border-accent focus:outline-none"
          >
            {SCORE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Value
          <select
            value={valueScore}
            onChange={(e) => setValueScore(Number(e.target.value))}
            className="cursor-pointer rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 focus:border-accent focus:outline-none"
          >
            {SCORE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-1 text-sm">
          <input
            type="checkbox"
            checked={wouldRebuy}
            onChange={(e) => setWouldRebuy(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Would rebuy
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Review (optional)
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
        />
      </label>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Saving..." : "Save review"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={pending}
          className="cursor-pointer text-sm text-zinc-400 hover:text-foreground"
        >
          Cancel
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="ml-auto cursor-pointer text-sm text-red-500 hover:text-red-400"
          >
            Delete review
          </button>
        )}
      </div>
    </form>
  );
}
