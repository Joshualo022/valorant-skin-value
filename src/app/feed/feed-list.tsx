"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";

type FeedItem = {
  id: string;
  actorDisplayName: string;
  actorHref: string | null;
  skinName: string;
  skinImageUrl: string;
  occurredAt: string;
  text: string;
  reviewTextPreview: string | null;
  href: string;
};

// Seeded with the server-rendered first page; scrolling further fetches more
// via the same cursor pattern as the catalog grid (see skin-catalog.tsx) —
// a sentinel div that triggers the next fetch once it scrolls into view.
export function FeedList({
  initialItems,
  initialNextCursor,
}: {
  initialItems: FeedItem[];
  initialNextCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMore = useCallback(async (cursor: string) => {
    setIsLoadingMore(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/feed?cursor=${cursor}`);
      if (!res.ok) throw new Error("Request failed");
      const data: { items: FeedItem[]; nextCursor: string | null } = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch {
      setErrorMessage("Something went wrong loading more activity — please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

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

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        // Outer element is a plain div, not a Link — the actor's name links
        // to their profile while the rest of the card links to item.href (the
        // review or collection they acted on), and an <a> can't contain
        // another <a>, so those have to be siblings rather than nested.
        <div
          key={item.id}
          className="flex gap-3 rounded-2xl border border-border-subtle bg-surface p-3 transition-colors hover:border-zinc-600"
        >
          <Link href={item.href} className="relative h-14 w-14 shrink-0 rounded-lg bg-surface-2">
            <Image src={item.skinImageUrl} alt={item.skinName} fill className="object-contain p-1" sizes="56px" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm text-foreground">
              {item.actorHref ? (
                <Link href={item.actorHref} className="font-semibold hover:underline">
                  {item.actorDisplayName}
                </Link>
              ) : (
                <span className="font-semibold">{item.actorDisplayName}</span>
              )}{" "}
              <Link href={item.href} className="hover:underline">
                {item.text}
              </Link>
            </p>
            {item.reviewTextPreview && (
              <Link href={item.href} className="block truncate text-xs text-zinc-400">
                &ldquo;{item.reviewTextPreview}&rdquo;
              </Link>
            )}
            {/* suppressHydrationWarning: this text is *supposed* to differ
                between the server render and the client's first render —
                real time elapses between them, so "38s ago" becoming "39s
                ago" a moment later isn't a bug. */}
            <Link href={item.href} className="text-xs text-zinc-500" suppressHydrationWarning>
              {formatRelativeTime(new Date(item.occurredAt))}
            </Link>
          </div>
        </div>
      ))}

      {errorMessage && (
        <p role="alert" className="text-center text-xs text-red-500">
          {errorMessage}
        </p>
      )}

      {/* Sentinel for the IntersectionObserver above — invisible, just marks
          where "near the bottom" starts. */}
      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoadingMore && <span className="text-xs text-zinc-500">Loading more…</span>}
        </div>
      )}
    </div>
  );
}
