"use client";

import { useState } from "react";
import { HeartButton } from "@/components/heart-button";

// Thin client wrapper around the shared HeartButton (gold tone), same
// optimistic-toggle pattern as SkinLikeButton and FollowButton on this page.
export function AppraisalButton({
  targetUserId,
  isLoggedIn,
  initialAppraised,
  initialAppraisalCount,
}: {
  targetUserId: string;
  isLoggedIn: boolean;
  initialAppraised: boolean;
  initialAppraisalCount: number;
}) {
  const [appraised, setAppraised] = useState(initialAppraised);
  const [appraisalCount, setAppraisalCount] = useState(initialAppraisalCount);
  const [pending, setPending] = useState(false);

  async function toggleAppraisal() {
    const wasAppraised = appraised;
    setPending(true);
    setAppraised(!wasAppraised);
    setAppraisalCount((c) => c + (wasAppraised ? -1 : 1));

    try {
      const res = await fetch(`/api/users/${targetUserId}/appraise`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { appraised: boolean; appraisalCount: number };
      setAppraised(data.appraised);
      setAppraisalCount(data.appraisalCount);
    } catch {
      setAppraised(wasAppraised);
      setAppraisalCount((c) => c + (wasAppraised ? 1 : -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <HeartButton
      liked={appraised}
      count={appraisalCount}
      pending={pending}
      isLoggedIn={isLoggedIn}
      onToggle={toggleAppraisal}
      tone="gold"
      label="Appreciate this collection"
    />
  );
}
