import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPage } from "@/lib/feed";
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/notifications";
import { getFollowing } from "@/lib/follows";
import { FeedList } from "./feed-list";
import { NotificationsList } from "./notifications-list";
import { FollowList } from "../u/[slug]/follow-list";

const TABS = [
  { value: "feed", label: "Feed" },
  { value: "notifications", label: "Notifications" },
  { value: "following", label: "Following" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.some((t) => t.value === rawTab) ? (rawTab as Tab) : "feed";

  // Fetched regardless of active tab so the pill on the Notifications label
  // stays accurate even while looking at a different tab.
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">Social</h1>

      <div className="flex gap-1 self-start rounded-full border border-border-subtle bg-surface-2 p-1 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "feed" ? "/social" : `/social?tab=${t.value}`}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold transition-colors ${
              tab === t.value ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
            }`}
          >
            {t.label}
            {t.value === "notifications" && unreadCount > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  tab === "notifications" ? "bg-white/25 text-white" : "bg-accent text-white"
                }`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === "feed" && <FeedTab userId={user.id} />}
      {tab === "notifications" && <NotificationsTab userId={user.id} />}
      {tab === "following" && <FollowingTab userId={user.id} />}
    </div>
  );
}

async function FeedTab({ userId }: { userId: string }) {
  const { items, nextCursor, isFollowingAnyone } = await getFeedPage(userId, { cursor: null });

  // Empty state doubles as a navigation element rather than a dead end — see
  // SOCIAL_CONSOLIDATION_SPEC.md §1: the home page is where discovery
  // (search, recent reviews) happens, so that's where "find someone worth
  // following" actually leads.
  if (!isFollowingAnyone) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-surface py-16 text-center">
        <p className="text-lg font-semibold">You&apos;re not following anyone yet</p>
        <p className="max-w-sm text-sm text-zinc-400">
          Follow reviewers to see their activity here — reviews, new collection adds, and loadout
          changes.
        </p>
        <Link
          href="/"
          className="mt-2 cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
        >
          Find reviewers worth following
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border-subtle bg-surface py-16 text-center">
        <p className="text-lg font-semibold">No activity yet</p>
        <p className="max-w-sm text-sm text-zinc-400">
          Nothing from the people you follow so far — check back once they review, add, or equip a skin.
        </p>
      </div>
    );
  }

  return (
    <FeedList
      initialItems={items}
      initialNextCursor={nextCursor ? encodeURIComponent(JSON.stringify(nextCursor)) : null}
    />
  );
}

async function NotificationsTab({ userId }: { userId: string }) {
  const { notifications, nextCursor } = await getNotificationsForUser(userId, { limit: 20 });
  return <NotificationsList initialItems={notifications} initialNextCursor={nextCursor} />;
}

async function FollowingTab({ userId }: { userId: string }) {
  const { items, nextCursor } = await getFollowing(userId, { viewerId: userId });
  return (
    <FollowList
      kind="following"
      userId={userId}
      initialItems={items}
      initialNextCursor={nextCursor}
      isLoggedIn
      viewerId={userId}
    />
  );
}
