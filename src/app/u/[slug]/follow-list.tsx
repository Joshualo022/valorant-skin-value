"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { FollowListCursor, FollowListItem } from "@/lib/follows";

const FOLLOW_BASE_CLASSES =
  "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const FOLLOWING_CLASSES = "border-border-subtle text-zinc-300 hover:border-red-500/50 hover:text-red-400";
const NOT_FOLLOWING_CLASSES =
  "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white hover:brightness-110";

// Infinite-scroll list, same sentinel/IntersectionObserver pattern as
// FeedList (see src/app/feed/feed-list.tsx). Each row's Follow/Unfollow
// button is a compact local version of FollowButton (no follower-count
// readout — that belongs on the profile page, not a list row).
export function FollowList({
  kind,
  userId,
  initialItems,
  initialNextCursor,
  isLoggedIn,
  viewerId,
}: {
  kind: "followers" | "following";
  userId: string;
  initialItems: FollowListItem[];
  initialNextCursor: FollowListCursor | null;
  isLoggedIn: boolean;
  viewerId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followState, setFollowState] = useState(
    () => new Map(initialItems.map((i) => [i.id, i.isFollowedByViewer]))
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const fetchMore = useCallback(
    async (cursor: FollowListCursor) => {
      setIsLoadingMore(true);
      try {
        const res = await fetch(`/api/users/${userId}/${kind}?cursor=${encodeURIComponent(JSON.stringify(cursor))}`);
        if (!res.ok) throw new Error("Request failed");
        const data: { items: FollowListItem[]; nextCursor: FollowListCursor | null } = await res.json();
        setItems((prev) => [...prev, ...data.items]);
        setFollowState((prev) => {
          const next = new Map(prev);
          data.items.forEach((i) => next.set(i.id, i.isFollowedByViewer));
          return next;
        });
        setNextCursor(data.nextCursor);
      } catch {
        // Best-effort — the sentinel just stops advancing; scrolling further
        // simply shows no more items rather than an error state.
      } finally {
        setIsLoadingMore(false);
      }
    },
    [userId, kind]
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!nextCursor) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          fetchMore(nextCursor);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore, fetchMore]);

  async function toggleFollow(targetId: string) {
    const wasFollowing = followState.get(targetId) ?? false;
    setPendingIds((ids) => new Set(ids).add(targetId));
    setFollowState((prev) => new Map(prev).set(targetId, !wasFollowing));

    try {
      const res = await fetch(`/api/users/${targetId}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { following: boolean };
      setFollowState((prev) => new Map(prev).set(targetId, data.following));
    } catch {
      setFollowState((prev) => new Map(prev).set(targetId, wasFollowing));
    } finally {
      setPendingIds((ids) => {
        const next = new Set(ids);
        next.delete(targetId);
        return next;
      });
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const following = followState.get(item.id) ?? item.isFollowedByViewer;
        const isSelf = item.id === viewerId;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-3"
          >
            {item.slug ? (
              <Link href={`/u/${item.slug}`} className="flex min-w-0 items-center gap-3">
                <Avatar avatarId={item.avatarId} displayName={item.displayName} size="md" />
                <span className="truncate text-sm font-semibold hover:underline">{item.displayName}</span>
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar avatarId={item.avatarId} displayName={item.displayName} size="md" />
                <span className="truncate text-sm font-semibold">{item.displayName}</span>
              </div>
            )}
            {isLoggedIn && !isSelf && (
              <button
                onClick={() => toggleFollow(item.id)}
                disabled={pendingIds.has(item.id)}
                className={`${FOLLOW_BASE_CLASSES} ${following ? FOLLOWING_CLASSES : NOT_FOLLOWING_CLASSES}`}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        );
      })}

      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoadingMore && <span className="text-xs text-zinc-500">Loading more…</span>}
        </div>
      )}
    </div>
  );
}
