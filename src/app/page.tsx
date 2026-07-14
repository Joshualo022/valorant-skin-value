import Link from "next/link";
import { getRecentlyReviewedSkins } from "@/lib/reviews";
import { HomeSearch } from "./home-search";
import { RecentlyReviewedCarousel } from "./recently-reviewed-carousel";

export default async function Home() {
  const recentReviews = await getRecentlyReviewedSkins(8);

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex flex-col items-center justify-center gap-10 overflow-hidden p-8 py-24 text-center sm:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/20 blur-[120px]"
        />

        <div className="relative flex flex-col items-center gap-3">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Was it worth the{" "}
            <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
              VP
            </span>
            ?
          </h1>
          <p className="max-w-lg text-lg text-zinc-400">
            Real reviews from players who actually own the skin. Search one up to see for
            yourself.
          </p>
        </div>

        <div className="relative w-full max-w-2xl">
          <HomeSearch />
        </div>
      </div>

      <RecentlyReviewedCarousel reviews={recentReviews} />

      <div className="mx-auto flex w-full max-w-4xl justify-center px-6 pb-20">
        <Link
          href="/catalog"
          className="group relative flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface px-6 py-4 text-left transition-colors hover:border-accent/50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden="true">
              <path
                d="M12 3v18M3 12h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-display font-semibold text-foreground">Explore all skins</span>
            <span className="text-sm text-zinc-400">
              Browse every skin — add what you own, like what you want.
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
