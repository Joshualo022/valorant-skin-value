import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateReviewInput } from "@/lib/reviews";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const skinId = body.skinId as string | undefined;
  if (!skinId) {
    return NextResponse.json({ error: "skinId is required" }, { status: 400 });
  }

  const validationError = validateReviewInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // You can only review a skin you own — the whole point of this app is
  // separating real ownership experience from general hype.
  const owned = await prisma.userOwnedSkin.findUnique({
    where: { userId_skinId: { userId: user.id, skinId } },
  });
  if (!owned) {
    return NextResponse.json({ error: "You don't own this skin" }, { status: 403 });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_skinId: { userId: user.id, skinId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already reviewed this skin — edit your existing review instead" },
      { status: 409 }
    );
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      skinId,
      qualityScore: body.qualityScore,
      valueScore: body.valueScore,
      wouldRebuy: body.wouldRebuy,
      reviewText: body.reviewText || null,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
