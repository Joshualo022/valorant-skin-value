import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compareWeapons } from "@/lib/weapon-order";
import { SkinCatalog } from "./skin-catalog";

export default async function CatalogPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [skins, weapons, ownedSkins, wishlistedSkins] = await Promise.all([
    prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        weaponId: true,
        contentTier: { select: { name: true, vpPrice: true, iconUrl: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.weapon.findMany(),
    prisma.userOwnedSkin.findMany({
      where: { userId: user.id },
      select: { skinId: true },
    }),
    prisma.wishlist.findMany({
      where: { userId: user.id },
      select: { skinId: true },
    }),
  ]);

  return (
    <SkinCatalog
      skins={skins}
      weapons={[...weapons].sort(compareWeapons)}
      initialOwnedSkinIds={ownedSkins.map((o) => o.skinId)}
      initialWishlistedSkinIds={wishlistedSkins.map((w) => w.skinId)}
    />
  );
}
