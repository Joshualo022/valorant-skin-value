import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { resolveDisplayName } from "@/lib/user";
import {
  getOwnedSkinsWithValue,
  getLoadoutValuation,
  getCollectionProgress,
  getReviewedSkinIds,
  getFollowCounts,
} from "@/lib/collection";
import { getLoadoutSlots } from "@/lib/loadout";
import { CollectionHeader } from "../collection-header";
import { LoadoutGrid } from "./loadout-grid";
import { AllOwnedSkinsGrid } from "../all-owned-skins-grid";
import { toFullOwnedSkins } from "../owned-skins-utils";

export default async function CollectionLoadoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const host = (await headers()).get("host");
  const origin = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "";

  const [{ ownedSkins, totalValue }, loadoutValuation, { reviewedCount }, slots, reviewedSkinIds, { followerCount, followingCount }] =
    await Promise.all([
      getOwnedSkinsWithValue(user.id),
      getLoadoutValuation(user.id),
      getCollectionProgress(user.id),
      getLoadoutSlots(user.id),
      getReviewedSkinIds(user.id),
      getFollowCounts(user.id),
    ]);

  const allOwnedSkins = toFullOwnedSkins(ownedSkins, reviewedSkinIds);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <CollectionHeader
        activeTab="loadout"
        displayName={resolveDisplayName(user)}
        avatarId={user.avatarId}
        ownedCount={ownedSkins.length}
        collectionValue={totalValue}
        loadoutValuation={loadoutValuation}
        reviewedCount={reviewedCount}
        collectionVisibility={user.collectionVisibility}
        shareSlug={user.collectionShareSlug}
        followerCount={followerCount}
        followingCount={followingCount}
        origin={origin}
        ownedSkinsForFlexItem={allOwnedSkins}
        flexItemSkinId={user.flexItemSkinId}
      />

      <div className="rounded-2xl border border-teal-900/40 bg-[#0a1518] bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.07),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(20,90,100,0.1),transparent_50%)] p-4 sm:p-6">
        <p className="mb-4 text-xs text-teal-400/60">Click an equipped card to switch chromas.</p>
        <LoadoutGrid slots={slots} />
      </div>

      <AllOwnedSkinsGrid allOwnedSkins={allOwnedSkins} />
    </div>
  );
}
