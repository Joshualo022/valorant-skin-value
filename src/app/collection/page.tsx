import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedSkinsWithValue } from "@/lib/collection";

export default async function MyCollectionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { ownedSkins, totalValue } = await getOwnedSkinsWithValue(user.id);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-xl font-semibold">My Collection</h1>
        <div className="text-lg font-medium">
          Total value: <span className="text-amber-400">{totalValue.toLocaleString()} VP</span>
        </div>
      </div>

      <Link href="/collection/build" className="self-start text-sm text-zinc-300 underline">
        + Add or remove skins
      </Link>

      {ownedSkins.length === 0 ? (
        <p className="text-zinc-400">
          You haven&apos;t added any skins yet.{" "}
          <Link href="/collection/build" className="underline">
            Build your collection
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ownedSkins.map((owned) => (
            <div
              key={owned.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-3"
            >
              <div className="relative h-20 w-full">
                <Image
                  src={owned.skin.imageUrl}
                  alt={owned.skin.name}
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
              <div className="truncate text-sm font-medium">{owned.skin.name}</div>
              <div className="text-xs text-zinc-400">{owned.skin.weapon.name}</div>
              <div className="text-xs text-zinc-400">
                {owned.skin.contentTier.name} · {owned.skin.contentTier.vpPrice.toLocaleString()}{" "}
                VP
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
