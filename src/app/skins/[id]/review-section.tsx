"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REVIEW_TAG_DIMENSIONS, type ReviewTagValue } from "@/lib/review-tags";

type ExistingReview = {
  id: string;
  qualityScore: number;
  valueScore: number;
  wouldRebuy: boolean;
  reviewText: string | null;
  tags: ReviewTagValue[];
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// Short label under the segmented control that updates as the user picks a
// score, so the number feels anchored to a meaning instead of a bare digit.
function qualityLabel(n: number | null) {
  if (n === null) return "Tap a number to rate quality";
  if (n <= 2) return "This skin is trash";
  if (n <= 4) return "Rough";
  if (n <= 6) return "Okay";
  if (n <= 8) return "Solid";
  return "I enjoy using this skin";
}

function valueLabel(n: number | null) {
  if (n === null) return "Tap a number to rate value";
  if (n <= 2) return "Too expensive";
  if (n <= 4) return "Pricey";
  if (n <= 6) return "Fair";
  if (n <= 8) return "Good deal";
  return "What a bargain";
}

function ScoreControl({
  label,
  lowEndpoint,
  highEndpoint,
  value,
  onChange,
  describe,
}: {
  label: string;
  lowEndpoint: string;
  highEndpoint: string;
  value: number | null;
  onChange: (n: number) => void;
  describe: (n: number | null) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span className="text-[11px] italic">
          {lowEndpoint} → {highEndpoint}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {SCORE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
              value === n
                ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                : "border-border-subtle bg-surface-2 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-zinc-400">{describe(value)}</span>
    </div>
  );
}

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
  const [qualityScore, setQualityScore] = useState<number | null>(
    existingReview?.qualityScore ?? null
  );
  const [valueScore, setValueScore] = useState<number | null>(existingReview?.valueScore ?? null);
  const [wouldRebuy, setWouldRebuy] = useState<boolean | null>(existingReview?.wouldRebuy ?? null);
  const [tags, setTags] = useState<Set<ReviewTagValue>>(
    () => new Set(existingReview?.tags ?? [])
  );
  const [reviewText, setReviewText] = useState(existingReview?.reviewText ?? "");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectivelyOwnsSkin = ownsSkin || justAdded;
  const canSubmit = qualityScore !== null && valueScore !== null && wouldRebuy !== null;

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

  function toggleTag(leftValue: ReviewTagValue, rightValue: ReviewTagValue, picked: ReviewTagValue) {
    setTags((prev) => {
      const next = new Set(prev);
      const alreadyPicked = prev.has(picked);
      next.delete(leftValue);
      next.delete(rightValue);
      if (!alreadyPicked) next.add(picked);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setErrorMessage(null);

    const payload = {
      qualityScore,
      valueScore,
      wouldRebuy,
      reviewText,
      tags: Array.from(tags),
    };

    try {
      const res = existingReview
        ? await fetch(`/api/reviews/${existingReview.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId, ...payload }),
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

  const summaryParts: string[] = [];
  if (qualityScore !== null) summaryParts.push(`${qualityScore}/10 quality`);
  if (valueScore !== null) summaryParts.push(`${valueScore}/10 value`);
  if (wouldRebuy !== null) summaryParts.push(wouldRebuy ? "would rebuy" : "would not rebuy");
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "Pick a quality and value score to continue";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border-subtle bg-surface p-4"
    >
      <ScoreControl
        label="Quality"
        lowEndpoint="This skin is trash"
        highEndpoint="I enjoy using this skin"
        value={qualityScore}
        onChange={setQualityScore}
        describe={qualityLabel}
      />

      <ScoreControl
        label="Value"
        lowEndpoint="Too expensive"
        highEndpoint="What a bargain"
        value={valueScore}
        onChange={setValueScore}
        describe={valueLabel}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">Would you buy this again?</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWouldRebuy(true)}
            aria-pressed={wouldRebuy === true}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              wouldRebuy === true
                ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                : "border-border-subtle bg-surface-2 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRebuy(false)}
            aria-pressed={wouldRebuy === false}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              wouldRebuy === false
                ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                : "border-border-subtle bg-surface-2 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            No
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500">
          Optional: how did specific parts of the skin land? (pick any, none required)
        </span>
        {REVIEW_TAG_DIMENSIONS.map((dim) => (
          <div key={dim.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-400">{dim.label}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => toggleTag(dim.left.value, dim.right.value, dim.left.value)}
                aria-pressed={tags.has(dim.left.value)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tags.has(dim.left.value)
                    ? "border-transparent bg-surface-2 text-zinc-100 ring-1 ring-zinc-500"
                    : "border-border-subtle text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {dim.left.label}
              </button>
              <button
                type="button"
                onClick={() => toggleTag(dim.left.value, dim.right.value, dim.right.value)}
                aria-pressed={tags.has(dim.right.value)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tags.has(dim.right.value)
                    ? "border-transparent bg-accent/15 text-accent ring-1 ring-accent/50"
                    : "border-border-subtle text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {dim.right.label}
              </button>
            </div>
          </div>
        ))}
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

      <p className="text-sm text-zinc-400">{summary}</p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !canSubmit}
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
