import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationsForUser, type NotificationCursor } from "@/lib/notifications";

// `limit` defaults to 15 (the bell dropdown asks for 5; the /social
// Notifications tab asks for more, plus a cursor to page further).
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const cursorParam = url.searchParams.get("cursor");
  let cursor: NotificationCursor | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(cursorParam);
    } catch {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }
  }

  const { notifications, unreadCount, nextCursor } = await getNotificationsForUser(user.id, { cursor, limit });
  return NextResponse.json({ notifications, unreadCount, nextCursor });
}
