import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveDisplayName } from "@/lib/user";

export type FeedCursor = { sortValue: string; id: string };

type FeedSource = "review" | "collection_add" | "loadout_equip";

type RawFeedRow = {
  source: FeedSource;
  actorId: string;
  skinId: string;
  occurredAt: Date;
  sortId: string;
  qualityScore: number | null;
  valueScore: number | null;
  reviewText: string | null;
};

export type FeedItem = {
  id: string;
  source: FeedSource;
  // Grouping key for render-time event collapsing (see FeedList in
  // src/app/social/feed-list.tsx) — consecutive items sharing (actorId,
  // source) collapse into one row. Not used for anything else.
  actorId: string;
  actorDisplayName: string;
  actorAvatarId: string | null;
  // Separate from href below: the actor's name links to their profile, the
  // rest of the card links to the thing they did (a review or collection).
  // null only for the rare stale actor who signed up before slugs existed
  // and hasn't logged back in since (see lib/share-slug.ts).
  actorHref: string | null;
  skinName: string;
  skinImageUrl: string;
  occurredAt: string;
  text: string;
  reviewTextPreview: string | null;
  href: string;
};

type FeedPageResult = {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
  // Distinguishes "you follow people but nothing's happened yet" from "you
  // don't follow anyone" — the page needs the latter for its empty state.
  isFollowingAnyone: boolean;
};

// One UNION ALL of the three source tables, keyset-paginated over the
// combined, ordered set — same idea as getCatalogPageByPrice in catalog.ts,
// just spanning three tables instead of one. Each non-review branch casts
// its missing columns to match the review branch's types, since Postgres
// requires every UNION branch to agree on column types.
async function queryFeedRows(
  followingIds: string[],
  cursor: FeedCursor | null | undefined,
  limit: number
): Promise<RawFeedRow[]> {
  const actorFilter = Prisma.sql`IN (${Prisma.join(followingIds)})`;

  const cursorCondition = cursor
    ? Prisma.sql`WHERE (occurred_at, sort_id) < (${new Date(cursor.sortValue)}, ${cursor.id})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    {
      source: FeedSource;
      actor_id: string;
      skin_id: string;
      occurred_at: Date;
      sort_id: string;
      quality_score: number | null;
      value_score: number | null;
      review_text: string | null;
    }[]
  >(Prisma.sql`
    WITH combined AS (
      SELECT
        'review'::text AS source, r.user_id AS actor_id, r.skin_id, r.created_at AS occurred_at, r.id AS sort_id,
        r.quality_score, r.value_score, r.review_text
      FROM reviews r
      WHERE r.user_id ${actorFilter}
      UNION ALL
      SELECT
        'collection_add'::text, uos.user_id, uos.skin_id, uos.added_at, uos.id,
        NULL::integer, NULL::integer, NULL::text
      FROM user_owned_skins uos
      WHERE uos.user_id ${actorFilter}
      UNION ALL
      SELECT
        'loadout_equip'::text, al.user_id, al.skin_id, al.updated_at, al.id,
        NULL::integer, NULL::integer, NULL::text
      FROM active_loadout al
      WHERE al.user_id ${actorFilter}
    )
    SELECT * FROM combined
    ${cursorCondition}
    ORDER BY occurred_at DESC, sort_id DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    source: r.source,
    actorId: r.actor_id,
    skinId: r.skin_id,
    occurredAt: r.occurred_at,
    sortId: r.sort_id,
    qualityScore: r.quality_score,
    valueScore: r.value_score,
    reviewText: r.review_text,
  }));
}

const REVIEW_PREVIEW_LENGTH = 140;

// Suffix only, not the full sentence — the actor's name is rendered
// separately (as a Link to their profile) by the caller, e.g. FeedList.
function feedText(source: FeedSource, skinName: string, qualityScore: number | null): string {
  switch (source) {
    case "review":
      return `rated the ${skinName} ${qualityScore}/10`;
    case "collection_add":
      return `added the ${skinName} to their collection`;
    case "loadout_equip":
      return `equipped the ${skinName}`;
  }
}

export async function getFeedPage(
  viewerId: string,
  { cursor, limit = 20 }: { cursor?: FeedCursor | null; limit?: number }
): Promise<FeedPageResult> {
  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return { items: [], nextCursor: null, isFollowingAnyone: false };
  }

  const rows = await queryFeedRows(followingIds, cursor, limit);

  const skinIds = [...new Set(rows.map((r) => r.skinId))];
  const actorIds = [...new Set(rows.map((r) => r.actorId))];

  const [skins, actors] = await Promise.all([
    prisma.skin.findMany({ where: { id: { in: skinIds } }, select: { id: true, name: true, imageUrl: true } }),
    prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, displayName: true, email: true, collectionShareSlug: true, avatarId: true },
    }),
  ]);
  const skinById = new Map(skins.map((s) => [s.id, s]));
  const actorById = new Map(actors.map((a) => [a.id, a]));

  const items: FeedItem[] = rows.flatMap((row) => {
    const skin = skinById.get(row.skinId);
    const actor = actorById.get(row.actorId);
    if (!skin || !actor) return [];

    const actorDisplayName = resolveDisplayName(actor);
    const actorHref = actor.collectionShareSlug ? `/u/${actor.collectionShareSlug}` : null;
    const text = feedText(row.source, skin.name, row.qualityScore);
    const reviewTextPreview =
      row.source === "review" && row.reviewText
        ? row.reviewText.length > REVIEW_PREVIEW_LENGTH
          ? `${row.reviewText.slice(0, REVIEW_PREVIEW_LENGTH)}…`
          : row.reviewText
        : null;

    // /u/:slug now resolves and handles PRIVATE gracefully on its own, so
    // this no longer needs to branch on collectionVisibility the way the old
    // /collection/:slug link did.
    const href =
      row.source === "review" ? `/skins/${skin.id}#review-${row.sortId}` : actorHref ?? `/skins/${skin.id}`;

    return [
      {
        id: `${row.source}:${row.sortId}`,
        source: row.source,
        actorId: row.actorId,
        actorDisplayName,
        actorAvatarId: actor.avatarId,
        actorHref,
        skinName: skin.name,
        skinImageUrl: skin.imageUrl,
        occurredAt: row.occurredAt.toISOString(),
        text,
        reviewTextPreview,
        href,
      },
    ];
  });

  let nextCursor: FeedCursor | null = null;
  if (rows.length === limit) {
    const last = rows[rows.length - 1];
    nextCursor = { sortValue: last.occurredAt.toISOString(), id: last.sortId };
  }

  return { items, nextCursor, isFollowingAnyone: true };
}
