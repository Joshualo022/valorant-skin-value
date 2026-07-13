import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFollowers, type FollowListCursor } from "@/lib/follows";

// Public — who follows this user. No auth required, same as follower counts
// shown on profile pages. Cursor-paginated; the viewer's own follow status
// per row is mixed in when logged in so list rows can show Follow/Unfollow.
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

  const page = await getFollowers(userId, { cursor, viewerId: viewer?.id });
  return NextResponse.json(page);
}
