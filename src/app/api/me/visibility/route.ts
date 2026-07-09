import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateShareSlug } from "@/lib/share-slug";

const VISIBILITY_VALUES = ["PRIVATE", "LINK"] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

// Replaces the old on/off /api/me/share: visibility is a named choice, and
// the share slug is a side effect of it rather than its own toggle. PRIVATE
// deliberately never touches an existing slug (so switching back to LINK
// later doesn't hand out a new link) — a slug is only ever generated, never
// cleared, by this route.
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

  if (visibility === "PRIVATE") {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { collectionVisibility: "PRIVATE" },
    });
    return NextResponse.json({ visibility: updated.collectionVisibility, slug: updated.collectionShareSlug });
  }

  if (user.collectionShareSlug) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { collectionVisibility: visibility as Visibility },
    });
    return NextResponse.json({ visibility: updated.collectionVisibility, slug: updated.collectionShareSlug });
  }

  // No slug yet — generate one as part of turning visibility on. Collisions
  // are astronomically unlikely at this alphabet/length, but retry against
  // the unique constraint a few times rather than assuming that (same as the
  // old share route did).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { collectionVisibility: visibility as Visibility, collectionShareSlug: generateShareSlug() },
      });
      return NextResponse.json({ visibility: updated.collectionVisibility, slug: updated.collectionShareSlug });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Could not generate a unique link — try again" }, { status: 500 });
}
