import { NextResponse } from "next/server";
import { getReviewsForSkin } from "@/lib/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await getReviewsForSkin(id);
  return NextResponse.json({ reviews });
}
