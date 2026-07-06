import { NextResponse } from "next/server";
import { getCatalogPage, type CatalogCursor, type CatalogSort } from "@/lib/catalog";

const SORT_OPTIONS: CatalogSort[] = ["name", "price-asc", "price-desc"];

function parseCursor(raw: string | null): CatalogCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed &&
      typeof parsed.id === "string" &&
      (typeof parsed.sortValue === "string" || typeof parsed.sortValue === "number")
    ) {
      return parsed;
    }
  } catch {
    // fall through to null — an unparseable cursor just restarts from page 1
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const weaponId = searchParams.get("weaponId") ?? undefined;
  const tierName = searchParams.get("tierName") ?? undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const sortParam = searchParams.get("sort");
  const sort = SORT_OPTIONS.includes(sortParam as CatalogSort)
    ? (sortParam as CatalogSort)
    : "price-desc";
  const cursor = parseCursor(searchParams.get("cursor"));

  const { skins, nextCursor } = await getCatalogPage({
    weaponId,
    tierName,
    search,
    sort,
    cursor,
    limit: 24,
  });

  return NextResponse.json({
    skins,
    nextCursor: nextCursor ? encodeURIComponent(JSON.stringify(nextCursor)) : null,
  });
}
