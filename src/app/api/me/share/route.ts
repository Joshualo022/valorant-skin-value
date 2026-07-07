import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateShareSlug } from "@/lib/share-slug";

// Enables sharing: assigns a slug if the user doesn't already have one.
// Idempotent — calling this again just returns the existing slug, since
// generating a new one would break any link the user already shared out.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.collectionShareSlug) {
    return NextResponse.json({ slug: user.collectionShareSlug });
  }

  // Collisions are astronomically unlikely at this alphabet/length, but retry
  // against the unique constraint a few times rather than assuming that.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { collectionShareSlug: generateShareSlug() },
      });
      return NextResponse.json({ slug: updated.collectionShareSlug }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Could not generate a unique link — try again" }, { status: 500 });
}

// Disables sharing: clears the slug, which is what makes /collection/:slug
// 404 for anyone who still has the old link.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { collectionShareSlug: null } });
  return new NextResponse(null, { status: 204 });
}
