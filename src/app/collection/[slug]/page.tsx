import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSharedCollectionBySlug } from "@/lib/collection";
import { getSkinPrice } from "@/lib/pricing";
import { getTierStyle } from "@/lib/tier-style";
import { LoadoutGrid } from "../loadout/loadout-grid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shared = await getSharedCollectionBySlug(slug);
  if (!shared) return {};

  return {
    title: `${shared.displayName}'s Collection`,
    description: `${shared.collectionSize} skins owned, ${shared.totalValue.toLocaleString()} VP face value.`,
  };
}

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shared = await getSharedCollectionBySlug(slug);
  if (!shared) notFound();

  const { displayName, loadoutSlots, collectionSize, totalValue, realisticValue, rarestItem } = shared;
  const hasEquippedSkin = loadoutSlots.some((slot) => slot.skin);
  const rarestTier = rarestItem ? getTierStyle(rarestItem.skin.contentTier.name) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col items-center gap-1 pt-4 text-center">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {displayName}&apos;s Collection
        </h1>
        <p className="text-sm text-zinc-400">
          {collectionSize} skin{collectionSize === 1 ? "" : "s"} owned
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Face value</div>
          <div className="mt-1 bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            {totalValue.toLocaleString()} VP
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Realistic value</div>
          <div className="mt-1 bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            {realisticValue.toLocaleString()} VP
          </div>
        </div>
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-surface p-4 text-center sm:col-span-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Collection size</div>
          <div className="mt-1 text-xl font-bold sm:text-2xl">{collectionSize}</div>
        </div>
      </div>

      {rarestItem && rarestTier && (
        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-4">
          <div className={`relative h-20 w-32 shrink-0 rounded-lg bg-surface-2 ${rarestTier.ringGlow}`}>
            <Image
              src={rarestItem.skin.imageUrl}
              alt={rarestItem.skin.name}
              fill
              className="object-contain p-2"
              sizes="150px"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Rarest item</div>
            <div className="truncate font-medium">{rarestItem.skin.name}</div>
            <div className={`text-xs ${rarestTier.text}`}>
              {rarestItem.skin.contentTier.name} · {getSkinPrice(rarestItem.skin).toLocaleString()} VP
            </div>
          </div>
        </div>
      )}

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
