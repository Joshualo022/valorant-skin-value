import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPage, type FeedCursor } from "@/lib/feed";

// Mirrors GET /api/skins/catalog's cursor encode/decode convention.
function parseCursor(raw: string | null): FeedCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed && typeof parsed.sortValue === "string" && typeof parsed.id === "string") {
      return parsed;
    }
  } catch {
    // fall through to null — an unparseable cursor just restarts from page 1
  }
  return null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = parseCursor(searchParams.get("cursor"));

  const { items, nextCursor } = await getFeedPage(user.id, { cursor, limit: 20 });

  return NextResponse.json({
    items,
    nextCursor: nextCursor ? encodeURIComponent(JSON.stringify(nextCursor)) : null,
  });
}
