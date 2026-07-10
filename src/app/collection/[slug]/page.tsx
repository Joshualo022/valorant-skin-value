import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCollectionAccess, getSharedCollectionBySlug } from "@/lib/collection";
import { getCurrentUser } from "@/lib/auth";
import { getSkinPrice } from "@/lib/pricing";
import { getTierStyle } from "@/lib/tier-style";
import { LoadoutGrid } from "../loadout/loadout-grid";
import { FollowButton } from "./follow-button";
import { AppraisalButton } from "./appraisal-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const access = await getCollectionAccess(slug);
  if (!access || !access.canView) return {};

  const shared = await getSharedCollectionBySlug(slug);
  if (!shared) return {};

  return {
    title: `${shared.displayName}'s Collection`,
    description: `${shared.collectionSize} skins owned, ${shared.totalValue.toLocaleString()} VP collection value.`,
  };
}

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getCurrentUser();
  const access = await getCollectionAccess(slug, viewer?.id);
  if (!access) notFound();

  if (access.visibility === "PRIVATE" && !access.isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 p-6 pt-24 text-center">
        <h1 className="font-display text-xl font-bold">This collection is private</h1>
        <p className="text-sm text-zinc-400">
          {access.displayName} hasn&apos;t made their collection visible to others.
        </p>
      </div>
    );
  }

  const shared = await getSharedCollectionBySlug(slug);
  if (!shared) notFound();

  const { displayName, loadoutSlots, collectionSize, totalValue, loadoutValuation, flexItem, weaponGroups } =
    shared;
  const hasEquippedSkin = loadoutSlots.some((slot) => slot.skin);
  const flexTier = flexItem ? getTierStyle(flexItem.contentTier.name) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col items-center gap-1 pt-4 text-center">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {displayName}&apos;s Collection
        </h1>
        <p className="text-sm text-zinc-400">
          {collectionSize} skin{collectionSize === 1 ? "" : "s"} owned
        </p>
        {!access.isOwner && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <FollowButton
              targetUserId={access.ownerId}
              isLoggedIn={!!viewer}
              initialFollowing={access.isFollowing}
              initialFollowerCount={access.followerCount}
            />
            <AppraisalButton
              targetUserId={access.ownerId}
              isLoggedIn={!!viewer}
              initialAppraised={access.isAppraised}
              initialAppraisalCount={access.appraisalCount}
            />
          </div>
        )}
      </div>

      {flexItem && flexTier && (
        <div
          className={`relative flex min-h-[220px] items-end overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br ${flexTier.gradient} p-6 sm:min-h-[280px]`}
        >
          <div className="absolute inset-0 bg-black/55" />
          <Image
            src={flexItem.imageUrl}
            alt={flexItem.name}
            fill
            className="object-contain object-right p-4 opacity-90 sm:p-2"
            sizes="800px"
          />
          <div className="relative z-10 flex flex-col gap-0.5">
            <span className={`text-xs font-semibold uppercase tracking-wide ${flexTier.text}`}>
              Flex Item · {flexItem.contentTier.name}
            </span>
            <span className="font-display text-2xl font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)] sm:text-3xl">
              {flexItem.name}
            </span>
            <span className="text-sm text-zinc-300">{getSkinPrice(flexItem).toLocaleString()} VP</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Collection value</div>
          <div className="mt-1 bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            {totalValue.toLocaleString()} VP
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Loadout valuation</div>
          <div className="mt-1 bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            {loadoutValuation.toLocaleString()} VP
          </div>
        </div>
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-surface p-4 text-center sm:col-span-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Collection size</div>
          <div className="mt-1 text-xl font-bold sm:text-2xl">{collectionSize}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Loadout</h2>
        {hasEquippedSkin ? (
          <div className="rounded-2xl border border-teal-900/40 bg-[#0a1518] bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.07),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(20,90,100,0.1),transparent_50%)] p-4">
            <LoadoutGrid slots={loadoutSlots} readOnly />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No active loadout set yet.</p>
        )}
      </div>

      {weaponGroups.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Full Collection ({collectionSize})
          </h2>
          <div className="flex flex-col gap-4">
            {weaponGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  {group.label}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {group.skins.map((skin) => {
                    const skinTier = getTierStyle(skin.contentTier.name);
                    return (
                      <Link
                        key={skin.skinId}
                        href={`/skins/${skin.skinId}`}
                        className="flex flex-col gap-1 rounded-xl border border-border-subtle/60 bg-surface/60 p-2 transition-colors hover:border-zinc-600"
                      >
                        <div className="relative h-12 w-full rounded-md bg-surface-2">
                          <Image
                            src={skin.imageUrl}
                            alt={skin.name}
                            fill
                            className="object-contain"
                            sizes="120px"
                          />
                        </div>
                        <div className="truncate text-xs font-medium">{skin.name}</div>
                        <div className={`text-[10px] ${skinTier.text}`}>
                          {getSkinPrice(skin).toLocaleString()} VP
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="pt-2 text-center text-xs text-zinc-600">
        Made with{" "}
        <Link href="/" className="text-accent underline">
          Valorant Skin Value
        </Link>{" "}
        — reviews from verified owners, not hype.
      </p>
    </div>
  );
}
