"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";

type FeedSource = "review" | "collection_add" | "loadout_equip";

type FeedItem = {
  id: string;
  source: FeedSource;
  actorId: string;
  actorDisplayName: string;
  actorHref: string | null;
  skinName: string;
  skinImageUrl: string;
  occurredAt: string;
  text: string;
  reviewTextPreview: string | null;
  href: string;
};

type FeedGroup = { key: string; item: FeedItem; count: number };

// Consecutive collection_add/loadout_equip rows from the same actor collapse
// into one — following one active user shouldn't produce 50 identical
// "equipped a skin" rows (see SOCIAL_CONSOLIDATION_SPEC.md §1). Reviews never
// collapse: each one carries its own score and text worth showing on its own.
// Purely a render-time grouping over already-fetched items — pagination
// itself still operates on the underlying uncollapsed rows via the cursor.
function groupFeedItems(items: FeedItem[]): FeedGroup[] {
  const groups: FeedGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (item.source !== "review" && last && last.item.source === item.source && last.item.actorId === item.actorId) {
      last.count += 1;
      continue;
    }
    groups.push({ key: item.id, item, count: 1 });
  }
  return groups;
}

function slimText(source: "collection_add" | "loadout_equip", count: number, singleText: string): string {
  if (count === 1) return singleText;
  return source === "loadout_equip" ? "updated their loadout" : `added ${count} skins to their collection`;
}

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

  const groups = useMemo(() => groupFeedItems(items), [items]);

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
      {groups.map(({ key, item, count }) => {
        // Reviews are the marquee item — full card with skin thumbnail and
        // score. Collection/loadout activity is a slim one-liner, no
        // thumbnail, so a busy feed still reads at a glance.
        if (item.source === "review") {
          return (
            // Not itself a Link — the actor's name links to their profile
            // while the rest links to item.href, and an <a> can't contain
            // another <a>, so those have to be siblings.
            <div
              key={key}
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
                    real time elapses between them, so "38s ago" becoming
                    "39s ago" a moment later isn't a bug. */}
                <Link href={item.href} className="text-xs text-zinc-500" suppressHydrationWarning>
                  {formatRelativeTime(new Date(item.occurredAt))}
                </Link>
              </div>
            </div>
          );
        }

        const text = slimText(item.source, count, item.text);
        return (
          <div key={key} className="flex items-center gap-1.5 border-b border-border-subtle/40 px-1 py-2 text-xs">
            {item.actorHref ? (
              <Link href={item.actorHref} className="shrink-0 font-semibold text-zinc-300 hover:underline">
                {item.actorDisplayName}
              </Link>
            ) : (
              <span className="shrink-0 font-semibold text-zinc-300">{item.actorDisplayName}</span>
            )}
            <Link href={item.href} className="min-w-0 flex-1 truncate text-zinc-400 hover:underline">
              {text}
            </Link>
            <span className="shrink-0 text-zinc-600" suppressHydrationWarning>
              {formatRelativeTime(new Date(item.occurredAt))}
            </span>
          </div>
        );
      })}

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
