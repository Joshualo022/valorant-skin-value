import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VISIBILITY_VALUES = ["PRIVATE", "LINK"] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

// Replaces the old on/off /api/me/share: visibility is a named choice. The
// share slug itself is no longer this route's concern — getCurrentUser
// guarantees every user already has one (see lib/share-slug.ts) — this route
// only ever flips collectionVisibility.
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const visibility = body.visibility as unknown;
  if (typeof visibility !== "string" || !VISIBILITY_VALUES.includes(visibility as Visibility)) {
    return NextResponse.json({ error: "visibility must be one of PRIVATE, LINK" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { collectionVisibility: visibility as Visibility },
  });
  return NextResponse.json({ visibility: updated.collectionVisibility, slug: updated.collectionShareSlug });
}
