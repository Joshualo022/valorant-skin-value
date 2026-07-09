import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPage } from "@/lib/feed";
import { FeedList } from "./feed-list";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { items, nextCursor, isFollowingAnyone } = await getFeedPage(user.id, { cursor: null });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">Feed</h1>

      {!isFollowingAnyone ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-surface py-16 text-center">
          <p className="text-lg font-semibold">Follow friends to see their activity here</p>
          <p className="max-w-sm text-sm text-zinc-400">
            When you follow someone, their reviews, new collection adds, and loadout changes show up
            here. Find friends through a shared collection link, then follow them from their page.
          </p>
          <Link
            href="/catalog"
            className="mt-2 cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
          >
            Browse Skins
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border-subtle bg-surface py-16 text-center">
          <p className="text-lg font-semibold">No activity yet</p>
          <p className="max-w-sm text-sm text-zinc-400">
            Nothing from the people you follow so far — check back once they review, add, or equip a skin.
          </p>
        </div>
      ) : (
        <FeedList
          initialItems={items}
          initialNextCursor={nextCursor ? encodeURIComponent(JSON.stringify(nextCursor)) : null}
        />
      )}
    </div>
  );
}
