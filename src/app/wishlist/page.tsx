import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedSkinsWithValue, getWishlistCounts } from "@/lib/wishlist";
import { WishlistView, type LikedSkin } from "./wishlist-view";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { wishlistedSkins } = await getWishlistedSkinsWithValue(user.id);
  const likeCounts = await getWishlistCounts(wishlistedSkins.map((entry) => entry.skin.id));

  const skins: LikedSkin[] = wishlistedSkins.map((entry) => ({
    skinId: entry.skin.id,
    name: entry.skin.name,
    imageUrl: entry.skin.imageUrl,
    weaponName: entry.skin.weapon.name,
    vpPriceOverride: entry.skin.vpPriceOverride,
    contentTier: entry.skin.contentTier,
    likeCount: likeCounts.get(entry.skin.id) ?? 1,
  }));

  return <WishlistView likedSkins={skins} />;
}
