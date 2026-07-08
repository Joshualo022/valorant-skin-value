import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CatalogSort = "name" | "price-asc" | "price-desc";

// Only one filter for now — a skin the viewer owns but hasn't reviewed. Kept
// as its own option rather than folded into weaponId/tierName since it
// depends on the viewer's identity, not just the skin's own attributes.
export type CatalogFilter = "unreviewed-owned";

// What the client remembers about the last row of the previous page —
// the sort field's value plus the row's id as a tiebreaker. This is a
// keyset ("seek") cursor, not an offset: each page is anchored to an exact
// row instead of a shifting "skip N" position, so pages stay stable even
// though prisma/seed.ts re-runs and adds new skins every Act.
export type CatalogCursor = {
  sortValue: string | number;
  id: string;
};

export type CatalogPageOptions = {
  weaponId?: string;
  tierName?: string;
  search?: string;
  sort?: CatalogSort;
  cursor?: CatalogCursor | null;
  limit?: number;
  // The logged-in viewer, if any — used to resolve isLikedByViewer per skin,
  // and (together with `filter`) to scope the unreviewed-owned filter to
  // that viewer's own ownership/reviews. Undefined (not just omitted) for a
  // logged-out request, so every skin correctly comes back not-liked and
  // the filter is silently ignored rather than erroring.
  viewerId?: string;
  filter?: CatalogFilter;
};

// What the two page-fetch functions below produce before like data is
// attached — kept separate from CatalogSkin so they don't need to know
// anything about likes themselves.
type CatalogSkinBase = {
  id: string;
  name: string;
  imageUrl: string;
  weaponId: string;
  vpPriceOverride: number | null;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
};

export type CatalogSkin = CatalogSkinBase & {
  likeCount: number;
  isLikedByViewer: boolean;
};

type CatalogPageResult = { skins: CatalogSkin[]; nextCursor: CatalogCursor | null };

// Attaches each skin's total like count and the viewer's own liked state in
// two queries total — one aggregation across the whole page's skin ids, one
// (skipped entirely if logged out) for the viewer's own likes among them —
// rather than a query per skin.
async function attachLikeData(
  skins: CatalogSkinBase[],
  viewerId: string | undefined
): Promise<CatalogSkin[]> {
  if (skins.length === 0) return [];
  const skinIds = skins.map((s) => s.id);

  const [likeCounts, viewerLikes] = await Promise.all([
    prisma.wishlist.groupBy({ by: ["skinId"], where: { skinId: { in: skinIds } }, _count: true }),
    viewerId
      ? prisma.wishlist.findMany({ where: { userId: viewerId, skinId: { in: skinIds } }, select: { skinId: true } })
      : Promise.resolve([]),
  ]);

  const likeCountBySkinId = new Map(likeCounts.map((g) => [g.skinId, g._count]));
  const likedSkinIds = new Set(viewerLikes.map((w) => w.skinId));

  return skins.map((skin) => ({
    ...skin,
    likeCount: likeCountBySkinId.get(skin.id) ?? 0,
    isLikedByViewer: likedSkinIds.has(skin.id),
  }));
}

// Filters, then sorts the ENTIRE matching set, then takes one page off the
// front — in that order, in a single query. That ordering is what keeps
// sorting and pagination from conflicting: every page is just a slice of
// one already-fully-sorted result, never re-sorted per page.
//
// "name" sort never needs a skin's price, so it stays on the plain Prisma
// query builder. The price sorts need each skin's *resolved* price —
// vpPriceOverride if set, else its content tier's price (see getSkinPrice
// in src/lib/pricing.ts) — and Prisma's query builder has no syntax for
// ordering by a computed COALESCE across a relation, so those two sorts
// drop down to raw SQL instead (see getCatalogPageByPrice below).
export async function getCatalogPage(options: CatalogPageOptions): Promise<CatalogPageResult> {
  const { sort = "price-desc", viewerId } = options;
  const { skins, nextCursor } =
    sort === "name" ? await getCatalogPageByName(options) : await getCatalogPageByPrice({ ...options, sort });

  return { skins: await attachLikeData(skins, viewerId), nextCursor };
}

type CatalogBasePageResult = { skins: CatalogSkinBase[]; nextCursor: CatalogCursor | null };

async function getCatalogPageByName({
  weaponId,
  tierName,
  search,
  cursor,
  limit = 24,
  viewerId,
  filter,
}: CatalogPageOptions): Promise<CatalogBasePageResult> {
  const filters: Prisma.SkinWhereInput[] = [];
  if (weaponId) filters.push({ weaponId });
  if (tierName) filters.push({ contentTier: { name: tierName } });
  if (search) filters.push({ name: { contains: search, mode: "insensitive" } });
  // Ignored (not an error) when logged out — there's no viewer to scope
  // "owned but unreviewed" to.
  if (filter === "unreviewed-owned" && viewerId) {
    filters.push({ ownedBy: { some: { userId: viewerId } } });
    filters.push({ NOT: { reviews: { some: { userId: viewerId } } } });
  }

  // The cursor condition is what makes this "seek" pagination: rather than
  // "skip N rows" (which can skip or repeat rows if the table changes
  // between requests), it asks the database directly for "everything after
  // this exact row, in this exact order" — an OR of "strictly past the last
  // sort value" and "tied on sort value, but past the last id".
  if (cursor) {
    filters.push({
      OR: [
        { name: { gt: cursor.sortValue as string } },
        { AND: [{ name: cursor.sortValue as string }, { id: { gt: cursor.id } }] },
      ],
    });
  }

  const skins = await prisma.skin.findMany({
    where: filters.length ? { AND: filters } : undefined,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      imageUrl: true,
      weaponId: true,
      vpPriceOverride: true,
      contentTier: { select: { name: true, vpPrice: true, iconUrl: true } },
    },
  });

  let nextCursor: CatalogCursor | null = null;
  if (skins.length === limit) {
    const last = skins[skins.length - 1];
    nextCursor = { sortValue: last.name, id: last.id };
  }

  return { skins, nextCursor };
}

// Escapes a search term for use inside a Postgres ILIKE pattern, so a user
// typing "%" or "_" searches for that literal character instead of it being
// treated as a wildcard.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

type RawCatalogRow = {
  id: string;
  name: string;
  imageUrl: string;
  weaponId: string;
  vpPriceOverride: number | null;
  tierName: string;
  tierVpPrice: number;
  tierIconUrl: string;
  effectivePrice: number;
};

async function getCatalogPageByPrice({
  weaponId,
  tierName,
  search,
  sort,
  cursor,
  limit = 24,
  viewerId,
  filter,
}: CatalogPageOptions & { sort: "price-asc" | "price-desc" }): Promise<CatalogBasePageResult> {
  // COALESCE(vpPriceOverride, tier price) — the same fallback getSkinPrice()
  // applies in application code, expressed here as SQL so the database can
  // sort and seek by it directly.
  const priceExpr = Prisma.sql`COALESCE(s.vp_price_override, ct.vp_price)`;

  const conditions: Prisma.Sql[] = [];
  if (weaponId) conditions.push(Prisma.sql`s.weapon_id = ${weaponId}`);
  if (tierName) conditions.push(Prisma.sql`ct.name = ${tierName}`);
  if (search) {
    conditions.push(Prisma.sql`s.name ILIKE ${"%" + escapeLikePattern(search) + "%"}`);
  }
  // Same rule as getCatalogPageByName's Prisma-builder version, expressed as
  // EXISTS/NOT EXISTS since this path is raw SQL. Ignored when logged out.
  if (filter === "unreviewed-owned" && viewerId) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM user_owned_skins uos WHERE uos.skin_id = s.id AND uos.user_id = ${viewerId})`
    );
    conditions.push(
      Prisma.sql`NOT EXISTS (SELECT 1 FROM reviews r WHERE r.skin_id = s.id AND r.user_id = ${viewerId})`
    );
  }
  if (cursor) {
    const compare = sort === "price-asc" ? Prisma.sql`>` : Prisma.sql`<`;
    conditions.push(
      Prisma.sql`(${priceExpr} ${compare} ${cursor.sortValue} OR (${priceExpr} = ${cursor.sortValue} AND s.id > ${cursor.id}))`
    );
  }
  const whereClause = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;

  // `id asc` is the tiebreaker for every sort mode — without it, rows that
  // tie on the primary sort field (e.g. many skins sharing the same price)
  // would have no stable relative order, and the cursor above wouldn't
  // reliably know what "after this row" means.
  const orderDirection = sort === "price-asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const rows = await prisma.$queryRaw<RawCatalogRow[]>(Prisma.sql`
    SELECT
      s.id,
      s.name,
      s.image_url AS "imageUrl",
      s.weapon_id AS "weaponId",
      s.vp_price_override AS "vpPriceOverride",
      ct.name AS "tierName",
      ct.vp_price AS "tierVpPrice",
      ct.icon_url AS "tierIconUrl",
      ${priceExpr} AS "effectivePrice"
    FROM skins s
    JOIN content_tiers ct ON s.content_tier_id = ct.id
    ${whereClause}
    ORDER BY ${priceExpr} ${orderDirection}, s.id ASC
    LIMIT ${limit}
  `);

  const skins: CatalogSkinBase[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl,
    weaponId: r.weaponId,
    vpPriceOverride: r.vpPriceOverride,
    contentTier: { name: r.tierName, vpPrice: r.tierVpPrice, iconUrl: r.tierIconUrl },
  }));

  let nextCursor: CatalogCursor | null = null;
  if (rows.length === limit) {
    const last = rows[rows.length - 1];
    nextCursor = { sortValue: last.effectivePrice, id: last.id };
  }

  return { skins, nextCursor };
}
