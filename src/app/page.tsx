import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { HomeSearch } from "./home-search";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">Valorant Skin Value</h1>
      <p className="max-w-md text-zinc-600">
        Review skins you actually own, and see what your collection is worth.
      </p>
      <HomeSearch />

      <Link
        href={user ? "/collection/build" : "/signup"}
        className="mt-4 flex max-w-sm flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-4 text-left text-sm hover:border-zinc-500"
      >
        <span className="font-semibold text-white">My skins</span>
        <span className="text-zinc-400">
          Build your collection and see its total value in VP.
        </span>
      </Link>
    </div>
  );
}
