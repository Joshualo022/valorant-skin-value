import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CollectionBuilder } from "./collection-builder";

export default async function CollectionBuildPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [skins, weapons, ownedSkins] = await Promise.all([
    prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        weaponId: true,
        contentTier: { select: { name: true, vpPrice: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.weapon.findMany({ orderBy: { name: "asc" } }),
    prisma.userOwnedSkin.findMany({
      where: { userId: user.id },
      select: { skinId: true },
    }),
  ]);

  return (
    <CollectionBuilder
      skins={skins}
      weapons={weapons}
      initialOwnedSkinIds={ownedSkins.map((o) => o.skinId)}
    />
  );
}
