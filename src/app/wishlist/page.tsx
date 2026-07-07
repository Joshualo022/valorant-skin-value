import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedSkinsWithValue } from "@/lib/wishlist";
import { WishlistView, type WishlistedSkin } from "./wishlist-view";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { wishlistedSkins } = await getWishlistedSkinsWithValue(user.id);

  const skins: WishlistedSkin[] = wishlistedSkins.map((entry) => ({
    skinId: entry.skin.id,
    name: entry.skin.name,
    imageUrl: entry.skin.imageUrl,
    weaponName: entry.skin.weapon.name,
    vpPriceOverride: entry.skin.vpPriceOverride,
    contentTier: entry.skin.contentTier,
  }));

  return <WishlistView wishlistedSkins={skins} />;
}
