import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Marks a specific set of notifications as read in one updateMany call —
// the client passes the ids it's currently displaying (the same 15 the
// GET returned), rather than this route guessing "the 15 most recent" itself.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const ids = body.ids as unknown;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, id: { in: ids } },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
