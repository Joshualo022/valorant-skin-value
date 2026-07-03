import { prisma } from "@/lib/prisma";

// A user's collection value is the sum of the VP price of each owned
// skin's content tier — the core aggregation the whole app is built around.
export async function getOwnedSkinsWithValue(userId: string) {
  const ownedSkins = await prisma.userOwnedSkin.findMany({
    where: { userId },
    include: {
      skin: { include: { weapon: true, contentTier: true, skinLine: true } },
      chroma: true,
    },
    orderBy: { addedAt: "desc" },
  });

  const totalValue = ownedSkins.reduce(
    (sum, owned) => sum + owned.skin.contentTier.vpPrice,
    0
  );

  return { ownedSkins, totalValue };
}
