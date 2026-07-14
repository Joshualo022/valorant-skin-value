import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedSkinsWithValue } from "@/lib/collection";
import { compareWeapons } from "@/lib/weapon-order";
import { SkinCatalog } from "./skin-catalog";

export default async function CatalogPage() {
  const user = await getCurrentUser();

  // The catalog itself (all 1000+ skins) is no longer fetched here — it's
  // loaded a page at a time by the client via /api/skins/catalog, since
  // shipping every skin's data on first load is exactly what made this page
  // slow. Only the small, per-user stuff still comes from the server. Like
  // state (count + isLikedByViewer) travels with each paginated skin instead
  // of as a separate full-collection set like ownership does — see
  // src/lib/catalog.ts's attachLikeData.
  //
  // The page itself no longer requires login — a logged-out visitor can
  // browse and see prices, they just can't own/like anything (gated
  // client-side in SkinCatalog, same pattern as HeartButton). Without a
  // user there's no ownership/value data to fetch at all.
  const [weapons, tiers, ownedSkins, ownedValue] = await Promise.all([
    prisma.weapon.findMany(),
    prisma.contentTier.findMany({
      select: { id: true, name: true, vpPrice: true },
      orderBy: { vpPrice: "asc" },
    }),
    user
      ? prisma.userOwnedSkin.findMany({
          where: { userId: user.id },
          select: { skinId: true },
        })
      : Promise.resolve([]),
    user ? getOwnedSkinsWithValue(user.id) : Promise.resolve({ totalValue: 0 }),
  ]);

  return (
    <SkinCatalog
      weapons={[...weapons].sort(compareWeapons)}
      tiers={tiers}
      initialOwnedSkinIds={ownedSkins.map((o) => o.skinId)}
      totalValue={ownedValue.totalValue}
      isLoggedIn={!!user}
    />
  );
}
