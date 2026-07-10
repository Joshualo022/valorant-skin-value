import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { notifications, unreadCount } = await getNotificationsForUser(user.id);
  return NextResponse.json({ notifications, unreadCount });
}
