import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidAvatarId } from "@/lib/avatars";

// Updates the current user's own profile fields — displayName and/or
// avatarId, each optional so a caller can send just the one it's changing
// (see the first-login interstitial and /settings). The general "edit my
// profile" endpoint, kept separate from the resource-specific routes under
// /api/me/* (collection, wishlist, etc).
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const data: { displayName?: string; avatarId?: string | null } = {};

  if ("displayName" in body) {
    const displayName = body.displayName;
    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json({ error: "displayName is required" }, { status: 400 });
    }
    if (displayName.length > 30) {
      return NextResponse.json({ error: "displayName must be 30 characters or fewer" }, { status: 400 });
    }
    data.displayName = displayName.trim();
  }

  if ("avatarId" in body) {
    const avatarId = body.avatarId;
    // null is the valid "revert to letter avatar" value — only a non-null,
    // non-empty string has to match one of the 30 curated combos.
    if (avatarId !== null && !isValidAvatarId(avatarId)) {
      return NextResponse.json({ error: "avatarId must be a known avatar or null" }, { status: 400 });
    }
    data.avatarId = avatarId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({ displayName: updated.displayName, avatarId: updated.avatarId });
}
