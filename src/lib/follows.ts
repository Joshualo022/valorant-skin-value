import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";

export type FollowListCursor = { createdAt: string; id: string };

export type FollowListItem = {
  id: string;
  displayName: string;
  slug: string | null;
  isFollowedByViewer: boolean;
};

export type FollowListPage = {
  items: FollowListItem[];
  nextCursor: FollowListCursor | null;
};

const PAGE_SIZE = 30;

type UserSelect = { id: string; displayName: string | null; email: string; collectionShareSlug: string | null };

// Same keyset-pagination shape as getFeedPage (see lib/feed.ts), just over
// the follows table directly instead of a UNION — createdAt alone isn't a
// unique sort key (two follows can land in the same instant), so every page
// boundary needs the row id as a tiebreaker too.
function cursorWhere(cursor: FollowListCursor | null | undefined) {
  if (!cursor) return {};
  return {
    OR: [
      { createdAt: { lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
    ],
  };
}

async function toPage(
  rows: { id: string; createdAt: Date; user: UserSelect }[],
  viewerId: string | undefined
): Promise<FollowListPage> {
  const targetIds = rows.map((r) => r.user.id);
  const followedSet =
    viewerId && targetIds.length
      ? new Set(
          (
            await prisma.follow.findMany({
              where: { followerId: viewerId, followingId: { in: targetIds } },
              select: { followingId: true },
            })
          ).map((f) => f.followingId)
        )
      : new Set<string>();

  const items: FollowListItem[] = rows.map((r) => ({
    id: r.user.id,
    displayName: resolveDisplayName(r.user),
    slug: r.user.collectionShareSlug,
    isFollowedByViewer: followedSet.has(r.user.id),
  }));

  const nextCursor =
    rows.length === PAGE_SIZE
      ? { createdAt: rows[rows.length - 1].createdAt.toISOString(), id: rows[rows.length - 1].id }
      : null;

  return { items, nextCursor };
}

// Who follows this user.
export async function getFollowers(
  userId: string,
  { cursor, viewerId }: { cursor?: FollowListCursor | null; viewerId?: string }
): Promise<FollowListPage> {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId, ...cursorWhere(cursor) },
    select: {
      id: true,
      createdAt: true,
      follower: { select: { id: true, displayName: true, email: true, collectionShareSlug: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
  });
  return toPage(
    rows.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.follower })),
    viewerId
  );
}

// Who this user follows.
export async function getFollowing(
  userId: string,
  { cursor, viewerId }: { cursor?: FollowListCursor | null; viewerId?: string }
): Promise<FollowListPage> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId, ...cursorWhere(cursor) },
    select: {
      id: true,
      createdAt: true,
      following: { select: { id: true, displayName: true, email: true, collectionShareSlug: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
  });
  return toPage(
    rows.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.following })),
    viewerId
  );
}
