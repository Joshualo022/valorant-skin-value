"use client";

import { useState } from "react";
import { HeartButton } from "@/components/heart-button";

// Thin client wrapper around the shared HeartButton — the skin detail page
// itself is a server component, so the like/unlike optimistic state and API
// calls need to live in their own small client island, same pattern as
// ReviewSection and SkinImage on this page.
export function SkinLikeButton({
  skinId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  skinId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleLike() {
    const wasLiked = liked;
    setPending(true);
    setErrorMessage(null);
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    try {
      const res = wasLiked
        ? await fetch(`/api/me/wishlist/${skinId}`, { method: "DELETE" })
        : await fetch("/api/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
          });

      if (!res.ok) throw new Error("Request failed");
    } catch {
      setLiked(wasLiked);
      setCount((c) => c + (wasLiked ? 1 : -1));
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <HeartButton liked={liked} count={count} pending={pending} isLoggedIn={isLoggedIn} onToggle={toggleLike} />
      {errorMessage && (
        <p role="alert" className="text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
