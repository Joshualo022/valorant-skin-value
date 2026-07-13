"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";

type NotificationItem = {
  id: string;
  type: "REVIEW_LIKED" | "COLLECTION_APPRAISED" | "NEW_FOLLOWER" | "REVIEW_COMMENTED";
  read: boolean;
  createdAt: string;
  fromUserDisplayName: string;
  fromUserHref: string | null;
  message: string;
  href: string | null;
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// Fetched once on page load, no polling — the count/list are only refreshed
// by a hard reload. A preview of the latest 5 (full browsable history lives
// at /social?tab=notifications — see the "View all" footer below). Opening
// the dropdown marks everything currently loaded as read in one batch call,
// same pattern as the optimistic toggles elsewhere (FollowButton,
// HeartButton): flip local state immediately, don't wait on the round trip
// to feel responsive.
const PREVIEW_LIMIT = 5;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/me/notifications?limit=${PREVIEW_LIMIT}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notifications: NotificationItem[]; unreadCount: number } | null) => {
        if (!data) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (open || notifications.length === 0 || unreadCount === 0) return;

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await fetch("/api/me/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: notifications.map((n) => n.id) }),
      });
    } catch {
      // Best-effort — a failed mark-as-read just means the badge reappears
      // next page load, not worth rolling back the optimistic UI for.
    }
  }

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-surface hover:text-foreground"
      >
        <BellIcon />
        {loaded && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-subtle bg-surface p-2 shadow-lg">
            <div className="px-2 py-1.5 text-sm font-semibold text-foreground">Notifications</div>
            <div className="flex flex-col gap-1">
              {notifications.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">No notifications yet.</p>
              ) : (
                // The actor's name links to their profile, the rest of the
                // message links to n.href (a review or the recipient's own
                // collection) — an <a> can't contain another <a>, so these
                // are two sibling Links rather than one wrapping the row.
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl px-2 py-2 text-sm transition-colors ${
                      n.read ? "text-zinc-300" : "bg-accent/10 text-foreground"
                    }`}
                  >
                    <p>
                      {n.fromUserHref ? (
                        <Link
                          href={n.fromUserHref}
                          onClick={() => setOpen(false)}
                          className="font-semibold hover:underline"
                        >
                          {n.fromUserDisplayName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{n.fromUserDisplayName}</span>
                      )}{" "}
                      {n.href ? (
                        <Link href={n.href} onClick={() => setOpen(false)} className="hover:underline">
                          {n.message}
                        </Link>
                      ) : (
                        n.message
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatRelativeTime(new Date(n.createdAt))}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/social?tab=notifications"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl px-2 py-1.5 text-center text-xs font-semibold text-zinc-400 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
