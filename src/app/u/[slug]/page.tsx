import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCollectionAccess, getSharedCollectionBySlug, getOwnedSkinsWithValue } from "@/lib/collection";
import { getCurrentUser } from "@/lib/auth";
import { getSkinPrice } from "@/lib/pricing";
import { getTierStyle } from "@/lib/tier-style";
import { VpAmount } from "@/components/vp-amount";
import { Avatar } from "@/components/avatar";
import { toFullOwnedSkins, type FullOwnedSkin } from "../../collection/owned-skins-utils";
import { LoadoutGrid } from "../../collection/loadout/loadout-grid";
import { FollowButton } from "./follow-button";
import { AppraisalButton } from "./appraisal-button";
import { FlexItemCard } from "./flex-item-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const access = await getCollectionAccess(slug);
  if (!access) return {};

  return {
    title: `${access.displayName}'s Profile`,
    description: `${access.followerCount} follower${access.followerCount === 1 ? "" : "s"} on Valorant Skin Value.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getCurrentUser();
  const access = await getCollectionAccess(slug, viewer?.id);
  if (!access) notFound();

  const {
    ownerId,
    displayName,
    followerCount,
    followingCount,
    isFollowing,
    appraisalCount,
    isAppraised,
    isOwner,
    canView,
    avatarId,
  } = access;

  // Only fetched for the owner's own view — the flex item picker needs the
  // full owned-skins list, which a visitor never needs paid for.
  const ownedSkinsForPicker = isOwner
    ? toFullOwnedSkins((await getOwnedSkinsWithValue(ownerId)).ownedSkins, new Set())
    : [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <Avatar avatarId={avatarId} displayName={displayName} size="lg" />
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{displayName}</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/u/${slug}/followers`} className="text-zinc-300 hover:text-foreground">
            <span className="font-semibold text-foreground">{followerCount}</span> follower
            {followerCount === 1 ? "" : "s"}
          </Link>
          <Link href={`/u/${slug}/following`} className="text-zinc-300 hover:text-foreground">
            <span className="font-semibold text-foreground">{followingCount}</span> following
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {isOwner ? (
            <Link
              href="/collection"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              My Collection
            </Link>
          ) : (
            <>
              <FollowButton
                targetUserId={ownerId}
                isLoggedIn={!!viewer}
                initialFollowing={isFollowing}
                initialFollowerCount={followerCount}
              />
              <AppraisalButton
                targetUserId={ownerId}
                isLoggedIn={!!viewer}
                initialAppraised={isAppraised}
                initialAppraisalCount={appraisalCount}
              />
            </>
          )}
        </div>
      </div>

      {!canView ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-surface p-6 text-center">
          <h2 className="font-display text-lg font-bold">This collection is private</h2>
          <p className="text-sm text-zinc-400">{displayName} hasn&apos;t made their collection visible to others.</p>
        </div>
      ) : (
        <ProfileCollection slug={slug} isOwner={isOwner} ownedSkinsForPicker={ownedSkinsForPicker} />
      )}
    </div>
  );
}

async function ProfileCollection({
  slug,
  isOwner,
  ownedSkinsForPicker,
}: {
  slug: string;
  isOwner: boolean;
  ownedSkinsForPicker: FullOwnedSkin[];
}) {
  const shared = await getSharedCollectionBySlug(slug);
  if (!shared) notFound();

  const { collectionSize, totalValue, loadoutValuation, loadoutSlots, flexItem, weaponGroups } = shared;
  const hasEquippedSkin = loadoutSlots.some((slot) => slot.skin);
  const flexTier = flexItem ? getTierStyle(flexItem.contentTier.name) : null;

  return (
    <div className="flex flex-col gap-6">
      {isOwner ? (
        <FlexItemCard ownedSkins={ownedSkinsForPicker} initialFlexItemSkinId={flexItem?.id ?? null} />
      ) : (
        flexItem &&
        flexTier && (
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
              <VpAmount amount={getSkinPrice(flexItem)} className="text-sm text-zinc-300" iconSize={14} />
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Collection value</div>
          <VpAmount
            amount={totalValue}
            iconSize={18}
            className="mt-1 justify-center text-xl text-zinc-400 sm:text-2xl"
          />
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Loadout valuation</div>
          <VpAmount
            amount={loadoutValuation}
            iconSize={18}
            className="mt-1 justify-center text-xl text-zinc-400 sm:text-2xl"
          />
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{group.label}</h3>
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
                          <Image src={skin.imageUrl} alt={skin.name} fill className="object-contain" sizes="120px" />
                        </div>
                        <div className="truncate text-xs font-medium">{skin.name}</div>
                        <VpAmount amount={getSkinPrice(skin)} className={`text-[10px] ${skinTier.text}`} iconSize={10} />
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
