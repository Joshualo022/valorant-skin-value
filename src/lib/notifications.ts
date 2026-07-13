import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";
import type { NotificationType } from "@/generated/prisma/client";

// Called from inside the route handlers that cause each notification type
// (review like, follow, appraisal) right after the underlying row is
// created — never on the "un-" side of a toggle, and never for a user
// notifying themselves. Silently no-ops an identical repeat (same type,
// fromUserId, referenceId, recipient) so toggling something on/off/on
// doesn't spam duplicates, regardless of whether the earlier one was read.
export async function notify({
  userId,
  fromUserId,
  type,
  referenceId = null,
}: {
  userId: string;
  fromUserId: string;
  type: NotificationType;
  referenceId?: string | null;
}) {
  if (userId === fromUserId) return;

  const existing = await prisma.notification.findFirst({
    where: { userId, fromUserId, type, referenceId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.notification.create({ data: { userId, fromUserId, type, referenceId } });
}

// Cheap count-only query for the Notifications tab's pill label (see
// /social/page.tsx) — avoids fetching and resolving full notification rows
// just to render a badge when that tab isn't even the active one.
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export type NotificationForList = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  // Separate from message: fromUserDisplayName links to the actor's profile,
  // message is just the suffix ("liked your review", "followed you", …) and
  // links to href — same split as FeedItem (see lib/feed.ts).
  fromUserDisplayName: string;
  fromUserHref: string | null;
  message: string;
  href: string | null;
};

export type NotificationCursor = { createdAt: string; id: string };

// Same keyset-pagination shape as getFollowers/getFollowing (see
// lib/follows.ts) — createdAt alone isn't a unique sort key, so every page
// boundary needs the row id as a tiebreaker too.
function cursorWhere(cursor: NotificationCursor | null | undefined) {
  if (!cursor) return {};
  return {
    OR: [
      { createdAt: { lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
    ],
  };
}

// Resolves each type's display text/link server-side so callers (bell
// dropdown preview, full Notifications tab) just render strings — see
// GET /api/me/notifications. `limit` defaults to 15 for the bell; the
// Notifications tab passes a larger limit plus a cursor to page further.
export async function getNotificationsForUser(
  userId: string,
  { cursor, limit = 15 }: { cursor?: NotificationCursor | null; limit?: number } = {}
) {
  const [rows, unreadCount, recipient] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...cursorWhere(cursor) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      include: {
        fromUser: {
          select: {
            displayName: true,
            email: true,
            collectionShareSlug: true,
          },
        },
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.user.findUnique({ where: { id: userId }, select: { collectionShareSlug: true } }),
  ]);
  const ownHref = recipient?.collectionShareSlug ? `/u/${recipient.collectionShareSlug}` : null;

  // REVIEW_LIKED and REVIEW_COMMENTED both store the review id as
  // referenceId and both deep-link to the same review anchor.
  const reviewIds = rows
    .filter((n) => (n.type === "REVIEW_LIKED" || n.type === "REVIEW_COMMENTED") && n.referenceId)
    .map((n) => n.referenceId!);
  const reviews = reviewIds.length
    ? await prisma.review.findMany({
        where: { id: { in: reviewIds } },
        select: { id: true, skinId: true, skin: { select: { name: true } } },
      })
    : [];
  const reviewById = new Map(reviews.map((r) => [r.id, r]));

  const notifications: NotificationForList[] = rows.map((n) => {
    const fromUserDisplayName = resolveDisplayName(n.fromUser);
    // /u/:slug resolves for everyone with a slug regardless of visibility
    // (see lib/share-slug.ts), so this no longer needs the collectionVisibility
    // check the old /collection/:slug link required.
    const fromUserHref = n.fromUser.collectionShareSlug ? `/u/${n.fromUser.collectionShareSlug}` : null;

    if (n.type === "REVIEW_LIKED" || n.type === "REVIEW_COMMENTED") {
      const review = n.referenceId ? reviewById.get(n.referenceId) : undefined;
      const verb = n.type === "REVIEW_LIKED" ? "liked" : "commented on";
      return {
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        fromUserDisplayName,
        fromUserHref,
        message: review ? `${verb} your ${review.skin.name} review` : `${verb} your review`,
        // Reviews get id="review-[id]" on the skin page (see review-list.tsx)
        // so this anchor scrolls straight to the review being referenced,
        // not just the top of a skin with many reviews.
        href: review ? `/skins/${review.skinId}#review-${review.id}` : null,
      };
    }

    if (n.type === "COLLECTION_APPRAISED") {
      return {
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        fromUserDisplayName,
        fromUserHref,
        message: "appreciated your collection ⭐",
        href: ownHref,
      };
    }

    // NEW_FOLLOWER
    return {
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      fromUserDisplayName,
      fromUserHref,
      message: "followed you",
      href: fromUserHref,
    };
  });

  const nextCursor: NotificationCursor | null =
    rows.length === limit ? { createdAt: rows[rows.length - 1].createdAt.toISOString(), id: rows[rows.length - 1].id } : null;

  return { notifications, unreadCount, nextCursor };
}
