import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFollowing, type FollowListCursor } from "@/lib/follows";

// Public — who this user follows. Mirrors GET /api/users/:userId/followers,
// just queried from the other side of the same table.
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const viewer = await getCurrentUser();

  const cursorParam = new URL(request.url).searchParams.get("cursor");
  let cursor: FollowListCursor | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(cursorParam);
    } catch {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }
  }

  const page = await getFollowing(userId, { cursor, viewerId: viewer?.id });
  return NextResponse.json(page);
}
