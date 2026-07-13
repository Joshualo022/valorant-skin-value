import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Soft delete — the row stays (see Comment.deletedAt in schema.prisma) but
// is filtered out of every list. Only the comment's own author can delete
// it; the review author has no special deletion power over others' comments
// (no moderation UI this phase — see SOCIAL_CONSOLIDATION_SPEC.md §3).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (comment.userId !== user.id) {
    return NextResponse.json({ error: "You can only delete your own comment" }, { status: 403 });
  }

  await prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
