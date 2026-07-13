import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateReviewInput, setReviewTags } from "@/lib/reviews";
import type { ReviewTagValue } from "@/lib/review-tags";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "You can only edit your own review" }, { status: 403 });
  }

  const body = await request.json();
  const validationError = validateReviewInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const nextReviewText = body.reviewText || null;
  // Only stamp editedAt when something actually changed — a no-op save
  // (e.g. re-submitting the same form) shouldn't make comments look stale
  // against a review that never really moved.
  const didChange =
    existing.qualityScore !== body.qualityScore ||
    existing.valueScore !== body.valueScore ||
    existing.wouldRebuy !== body.wouldRebuy ||
    existing.reviewText !== nextReviewText;

  const review = await prisma.review.update({
    where: { id },
    data: {
      qualityScore: body.qualityScore,
      valueScore: body.valueScore,
      wouldRebuy: body.wouldRebuy,
      reviewText: nextReviewText,
      ...(didChange ? { editedAt: new Date() } : {}),
    },
  });

  if (body.tags !== undefined) {
    await setReviewTags(id, body.tags as ReviewTagValue[]);
  }

  return NextResponse.json({ review });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "You can only delete your own review" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
