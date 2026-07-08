import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Updates the current user's own profile fields. Only displayName exists for
// now (see the first-login interstitial and /settings), but this is the
// general "edit my profile" endpoint, so it stays separate from the
// resource-specific routes under /api/me/* (collection, wishlist, etc).
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const displayName = body.displayName;
  if (typeof displayName !== "string" || displayName.trim().length === 0) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }
  if (displayName.length > 30) {
    return NextResponse.json({ error: "displayName must be 30 characters or fewer" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { displayName: displayName.trim() },
  });

  return NextResponse.json({ displayName: updated.displayName });
}
