"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";
import { Avatar } from "@/components/avatar";

type NotificationCursor = { createdAt: string; id: string };

type NotificationItem = {
  id: string;
  type: "REVIEW_LIKED" | "COLLECTION_APPRAISED" | "NEW_FOLLOWER" | "REVIEW_COMMENTED";
  read: boolean;
  createdAt: string;
  fromUserDisplayName: string;
  fromUserAvatarId: string | null;
  fromUserHref: string | null;
  message: string;
  href: string | null;
};

// Full browsable, paginated notification history — the only place
// notifications are surfaced now that the header bell has been removed.
// Marks whatever's currently loaded as read as soon as it lands, since
// arriving on this tab already *is* "opening" it.
export function NotificationsList({
  initialItems,
  initialNextCursor,
}: {
  initialItems: NotificationItem[];
  initialNextCursor: NotificationCursor | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const markedIds = useRef<Set<string>>(new Set());

  const markRead = useCallback(async (unreadIds: string[]) => {
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedIds.current.add(id));
    try {
      await fetch("/api/me/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
    } catch {
      // Best-effort — a failed mark-as-read just means the badge reappears
      // next page load, not worth rolling back the optimistic UI for.
    }
  }, []);

  useEffect(() => {
    const unread = initialItems.filter((n) => !n.read && !markedIds.current.has(n.id)).map((n) => n.id);
    if (unread.length > 0) {
      setItems((prev) => prev.map((n) => (unread.includes(n.id) ? { ...n, read: true } : n)));
      markRead(unread);
    }
    // Only the initial batch — subsequent pages are handled by fetchMore below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMore = useCallback(
    async (cursor: NotificationCursor) => {
      setIsLoadingMore(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/me/notifications?limit=20&cursor=${encodeURIComponent(JSON.stringify(cursor))}`);
        if (!res.ok) throw new Error("Request failed");
        const data: { notifications: NotificationItem[]; nextCursor: NotificationCursor | null } = await res.json();
        setItems((prev) => [...prev, ...data.notifications]);
        setNextCursor(data.nextCursor);

        const unread = data.notifications.filter((n) => !n.read).map((n) => n.id);
        if (unread.length > 0) {
          setItems((prev) => prev.map((n) => (unread.includes(n.id) ? { ...n, read: true } : n)));
          markRead(unread);
        }
      } catch {
        setErrorMessage("Something went wrong loading more notifications — please try again.");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [markRead]
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

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">No notifications yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((n) => (
        // The actor's name links to their profile, the rest of the message
        // links to n.href — an <a> can't contain another <a>, so these are
        // two sibling Links rather than one wrapping the row.
        <div
          key={n.id}
          className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
            n.read ? "text-zinc-300" : "bg-accent/10 text-foreground"
          }`}
        >
          <Avatar avatarId={n.fromUserAvatarId} displayName={n.fromUserDisplayName} size="xs" />
          <div>
          <p>
            {n.fromUserHref ? (
              <Link href={n.fromUserHref} className="font-semibold hover:underline">
                {n.fromUserDisplayName}
              </Link>
            ) : (
              <span className="font-semibold">{n.fromUserDisplayName}</span>
            )}{" "}
            {n.href ? (
              <Link href={n.href} className="hover:underline">
                {n.message}
              </Link>
            ) : (
              n.message
            )}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{formatRelativeTime(new Date(n.createdAt))}</p>
          </div>
        </div>
      ))}

      {errorMessage && (
        <p role="alert" className="text-center text-xs text-red-500">
          {errorMessage}
        </p>
      )}

      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoadingMore && <span className="text-xs text-zinc-500">Loading more…</span>}
        </div>
      )}
    </div>
  );
}
