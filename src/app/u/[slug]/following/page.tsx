import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionAccess } from "@/lib/collection";
import { getCurrentUser } from "@/lib/auth";
import { getFollowing } from "@/lib/follows";
import { FollowList } from "../follow-list";

export default async function FollowingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getCurrentUser();
  const access = await getCollectionAccess(slug, viewer?.id);
  if (!access) notFound();

  const { items, nextCursor } = await getFollowing(access.ownerId, { viewerId: viewer?.id });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/u/${slug}`} className="text-lg text-zinc-400 hover:text-foreground" aria-label="Back to profile">
          ←
        </Link>
        <h1 className="font-display text-xl font-bold">{access.displayName}&apos;s Following</h1>
      </div>
      <FollowList
        kind="following"
        userId={access.ownerId}
        initialItems={items}
        initialNextCursor={nextCursor}
        isLoggedIn={!!viewer}
        viewerId={viewer?.id}
      />
    </div>
  );
}
