import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CatalogSort = "name" | "price-asc" | "price-desc";

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
};

// Filters, then sorts the ENTIRE matching set, then takes one page off the
// front — in that order, in a single query. That ordering is what keeps
// sorting and pagination from conflicting: every page is just a slice of
// one already-fully-sorted result, never re-sorted per page.
export async function getCatalogPage({
  weaponId,
  tierName,
  search,
  sort = "price-desc",
  cursor,
  limit = 24,
}: CatalogPageOptions) {
  const filters: Prisma.SkinWhereInput[] = [];
  if (weaponId) filters.push({ weaponId });
  if (tierName) filters.push({ contentTier: { name: tierName } });
  if (search) filters.push({ name: { contains: search, mode: "insensitive" } });

  // The cursor condition is what makes this "seek" pagination: rather than
  // "skip N rows" (which can skip or repeat rows if the table changes
  // between requests), it asks the database directly for "everything after
  // this exact row, in this exact order" — an OR of "strictly past the last
  // sort value" and "tied on sort value, but past the last id".
  if (cursor) {
    if (sort === "name") {
      filters.push({
        OR: [
          { name: { gt: cursor.sortValue as string } },
          { AND: [{ name: cursor.sortValue as string }, { id: { gt: cursor.id } }] },
        ],
      });
    } else if (sort === "price-asc") {
      filters.push({
        OR: [
          { contentTier: { vpPrice: { gt: cursor.sortValue as number } } },
          {
            AND: [
              { contentTier: { vpPrice: cursor.sortValue as number } },
              { id: { gt: cursor.id } },
            ],
          },
        ],
      });
    } else {
      filters.push({
        OR: [
          { contentTier: { vpPrice: { lt: cursor.sortValue as number } } },
          {
            AND: [
              { contentTier: { vpPrice: cursor.sortValue as number } },
              { id: { gt: cursor.id } },
            ],
          },
        ],
      });
    }
  }

  // `id asc` is the tiebreaker for every sort mode — without it, rows that
  // tie on the primary sort field (e.g. many skins sharing the same tier
  // price) would have no stable relative order, and the cursor above
  // wouldn't reliably know what "after this row" means.
  const orderBy: Prisma.SkinOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }, { id: "asc" }]
      : sort === "price-asc"
        ? [{ contentTier: { vpPrice: "asc" } }, { id: "asc" }]
        : [{ contentTier: { vpPrice: "desc" } }, { id: "asc" }];

  const skins = await prisma.skin.findMany({
    where: filters.length ? { AND: filters } : undefined,
    orderBy,
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

  // A full page came back, so there's likely more — hand back the last
  // row's sort value + id as the next cursor. A short page means we hit
  // the end of the result set.
  let nextCursor: CatalogCursor | null = null;
  if (skins.length === limit) {
    const last = skins[skins.length - 1];
    nextCursor = {
      sortValue: sort === "name" ? last.name : last.contentTier.vpPrice,
      id: last.id,
    };
  }

  return { skins, nextCursor };
}
