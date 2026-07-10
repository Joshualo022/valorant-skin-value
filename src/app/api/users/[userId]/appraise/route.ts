import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

// Single toggle endpoint, same reasoning as POST /api/users/:userId/follow —
// the client only knows "the heart was tapped," not which state it's
// currently in, so the route figures out appraise vs. un-appraise itself and
// reports back the resulting state.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { userId: toUserId } = await params;
  if (toUserId === user.id) {
    return NextResponse.json({ error: "You can't appraise your own collection" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingAppraisal = await prisma.collectionAppraisal.findUnique({
    where: { fromUserId_toUserId: { fromUserId: user.id, toUserId } },
  });

  if (existingAppraisal) {
    await prisma.collectionAppraisal.delete({ where: { id: existingAppraisal.id } });
  } else {
    await prisma.collectionAppraisal.create({ data: { fromUserId: user.id, toUserId } });
    await notify({ userId: toUserId, fromUserId: user.id, type: "COLLECTION_APPRAISED" });
  }

  const appraisalCount = await prisma.collectionAppraisal.count({ where: { toUserId } });

  return NextResponse.json({ appraised: !existingAppraisal, appraisalCount });
}
