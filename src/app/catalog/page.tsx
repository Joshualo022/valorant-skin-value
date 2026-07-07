import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedSkinsWithValue } from "@/lib/collection";
import { compareWeapons } from "@/lib/weapon-order";
import { SkinCatalog } from "./skin-catalog";

export default async function CatalogPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // The catalog itself (all 1000+ skins) is no longer fetched here — it's
  // loaded a page at a time by the client via /api/skins/catalog, since
  // shipping every skin's data on first load is exactly what made this page
  // slow. Only the small, per-user stuff still comes from the server. Like
  // state (count + isLikedByViewer) travels with each paginated skin instead
  // of as a separate full-collection set like ownership does — see
  // src/lib/catalog.ts's attachLikeData.
  const [weapons, tiers, ownedSkins, { totalValue }] = await Promise.all([
    prisma.weapon.findMany(),
    prisma.contentTier.findMany({
      select: { id: true, name: true, vpPrice: true },
      orderBy: { vpPrice: "asc" },
    }),
    prisma.userOwnedSkin.findMany({
      where: { userId: user.id },
      select: { skinId: true },
    }),
    getOwnedSkinsWithValue(user.id),
  ]);

  return (
    <SkinCatalog
      weapons={[...weapons].sort(compareWeapons)}
      tiers={tiers}
      initialOwnedSkinIds={ownedSkins.map((o) => o.skinId)}
      totalValue={totalValue}
    />
  );
}
