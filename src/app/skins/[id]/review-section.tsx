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
  const [isEditing, setIsEditing] = useState(false);
  const [qualityScore, setQualityScore] = useState(existingReview?.qualityScore ?? 7);
  const [valueScore, setValueScore] = useState(existingReview?.valueScore ?? 7);
  const [wouldRebuy, setWouldRebuy] = useState(existingReview?.wouldRebuy ?? true);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText ?? "");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-zinc-500">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to review skins you own.
      </p>
    );
  }

  if (!ownsSkin) {
    return (
      <p className="text-sm text-zinc-500">
        You don&apos;t own this skin yet.{" "}
        <Link href="/collection/build" className="underline">
          Add it to your collection
        </Link>{" "}
        to review it.
      </p>
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
        className="self-start rounded border border-zinc-700 px-4 py-2 text-sm"
      >
        {existingReview ? "Edit your review" : "Write a review"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-4">
      <div className="flex gap-6">
        <label className="flex flex-col gap-1 text-sm">
          Quality
          <select
            value={qualityScore}
            onChange={(e) => setQualityScore(Number(e.target.value))}
            className="rounded border border-zinc-700 bg-black px-2 py-1"
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
            className="rounded border border-zinc-700 bg-black px-2 py-1"
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
          className="rounded border border-zinc-700 bg-black px-3 py-2"
        />
      </label>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-white px-4 py-2 text-sm text-black disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save review"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={pending}
          className="text-sm text-zinc-400"
        >
          Cancel
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="ml-auto text-sm text-red-500"
          >
            Delete review
          </button>
        )}
      </div>
    </form>
  );
}
