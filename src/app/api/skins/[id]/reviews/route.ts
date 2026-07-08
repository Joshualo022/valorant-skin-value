import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReviewsForSkin } from "@/lib/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const reviews = await getReviewsForSkin(id, user?.id);
  return NextResponse.json({ reviews });
}
