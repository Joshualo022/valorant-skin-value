"use client";

import { useState } from "react";
import Link from "next/link";

const FILLED_CLASSES =
  "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white hover:brightness-110";
const MUTED_CLASSES =
  "border-border-subtle text-zinc-300 hover:border-red-500/50 hover:text-red-400";
const BASE_CLASSES =
  "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

// Optimistic toggle, same shape as the review like-button (see
// src/app/skins/[id]/review-list.tsx): flip local state immediately, roll
// back if the request fails.
export function FollowButton({
  targetUserId,
  isLoggedIn,
  initialFollowing,
  initialFollowerCount,
}: {
  targetUserId: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [pending, setPending] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={`${BASE_CLASSES} ${FILLED_CLASSES}`}>
          Follow
        </Link>
        <span className="text-xs text-zinc-500">
          {followerCount} follower{followerCount === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  async function toggleFollow() {
    const wasFollowing = following;
    setPending(true);
    setFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { following: boolean; followerCount: number };
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleFollow}
        disabled={pending}
        className={`${BASE_CLASSES} ${following ? MUTED_CLASSES : FILLED_CLASSES}`}
      >
        {following ? "Following" : "Follow"}
      </button>
      <span className="text-xs text-zinc-500">
        {followerCount} follower{followerCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
