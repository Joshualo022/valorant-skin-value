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

export type NotificationForList = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  message: string;
  href: string | null;
};

// Fetches the 15 most recent notifications for a user plus their total
// unread count, resolving each type's display text/link server-side so the
// bell dropdown can just render strings — see GET /api/me/notifications.
export async function getNotificationsForUser(userId: string) {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        fromUser: {
          select: {
            displayName: true,
            email: true,
            collectionShareSlug: true,
            collectionVisibility: true,
          },
        },
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const reviewIds = rows.filter((n) => n.type === "REVIEW_LIKED" && n.referenceId).map((n) => n.referenceId!);
  const reviews = reviewIds.length
    ? await prisma.review.findMany({
        where: { id: { in: reviewIds } },
        select: { id: true, skinId: true, skin: { select: { name: true } } },
      })
    : [];
  const reviewById = new Map(reviews.map((r) => [r.id, r]));

  const notifications: NotificationForList[] = rows.map((n) => {
    const fromUserName = resolveDisplayName(n.fromUser);

    if (n.type === "REVIEW_LIKED") {
      const review = n.referenceId ? reviewById.get(n.referenceId) : undefined;
      return {
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        message: review
          ? `${fromUserName} liked your ${review.skin.name} review`
          : `${fromUserName} liked your review`,
        href: review ? `/skins/${review.skinId}` : null,
      };
    }

    if (n.type === "COLLECTION_APPRAISED") {
      return {
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        message: `${fromUserName} appreciated your collection ⭐`,
        href: "/collection",
      };
    }

    // NEW_FOLLOWER
    const canLinkToFromUser =
      n.fromUser.collectionVisibility === "LINK" && !!n.fromUser.collectionShareSlug;
    return {
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      message: `${fromUserName} followed you`,
      href: canLinkToFromUser ? `/collection/${n.fromUser.collectionShareSlug}` : null,
    };
  });

  return { notifications, unreadCount };
}
