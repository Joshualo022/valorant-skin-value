import { NextResponse } from "next/server";
import { getSkinWithAggregateScores } from "@/lib/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getSkinWithAggregateScores(id);

  if (!result) {
    return NextResponse.json({ error: "Skin not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
