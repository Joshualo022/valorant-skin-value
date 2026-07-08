"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getTierStyle } from "@/lib/tier-style";
import { getSkinPrice } from "@/lib/pricing";
import { HeartButton } from "@/components/heart-button";

type SkinSummary = {
  id: string;
  name: string;
  imageUrl: string;
  weaponId: string;
  vpPriceOverride: number | null;
  contentTier: { name: string; vpPrice: number; iconUrl: string };
  likeCount: number;
  isLikedByViewer: boolean;
};

type Weapon = {
  id: string;
  name: string;
};

type ContentTierOption = {
  id: string;
  name: string;
  vpPrice: number;
};

type SortOption = "name" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
];

const PAGE_SIZE = 24;

export function SkinCatalog({
  weapons,
  tiers,
  initialOwnedSkinIds,
  totalValue,
}: {
  weapons: Weapon[];
  tiers: ContentTierOption[];
  initialOwnedSkinIds: string[];
  totalValue: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the URL (?weapon=vandal&tier=select) so a filtered view
  // is shareable/bookmarkable, per SPEC — but applying a filter never
  // triggers a full navigation: `router.replace` just rewrites the URL bar,
  // while the actual filtered page of skins is (re)fetched from
  // /api/skins/catalog below. `scroll: false` stops Next.js from jumping
  // the page back to top on every click.
  function setFilterParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const requestedWeaponSlug = searchParams.get("weapon");
  const requestedTierSlug = searchParams.get("tier");
  const requestedFilter = searchParams.get("filter");

  const [ownedSkinIds, setOwnedSkinIds] = useState(() => new Set(initialOwnedSkinIds));
  // null = "All Weapons" — the default landing state when arriving from the
  // home page or nav (no ?weapon= param). A specific weapon is only
  // pre-selected when the URL asked for one, e.g. the per-weapon "add skin"
  // deep link from My Collection — arriving from anywhere else should never
  // silently narrow the view to whichever weapon happens to sort first.
  const [selectedWeaponSlug, setSelectedWeaponSlug] = useState<string | null>(
    () =>
      requestedWeaponSlug && weapons.some((w) => w.name.toLowerCase() === requestedWeaponSlug)
        ? requestedWeaponSlug
        : null
  );
  // null = "All tiers" — a secondary, optional filter layered on top of the
  // primary weapon filter (see the two filter rows below).
  const [selectedTierSlug, setSelectedTierSlug] = useState<string | null>(
    () =>
      requestedTierSlug && tiers.some((t) => t.name.toLowerCase() === requestedTierSlug)
        ? requestedTierSlug
        : null
  );
  // Deep-linked from the skin detail page after a review submission (see
  // review-section.tsx) — "skins you own but haven't reviewed yet". Server
  // silently ignores it for a logged-out request rather than erroring, so
  // there's no separate not-logged-in UI state to handle here.
  const [unreviewedOwnedFilter, setUnreviewedOwnedFilter] = useState(
    () => requestedFilter === "unreviewed-owned"
  );
  const [pendingOwnershipSkinId, setPendingOwnershipSkinId] = useState<string | null>(null);
  const [pendingLikeSkinId, setPendingLikeSkinId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Tracks the skin just marked owned so we can prompt "rate it?" right at
  // the moment of ownership — the highest-leverage nudge per SPEC.md's
  // incentives section, rather than a generic reminder elsewhere.
  const [justOwnedSkinId, setJustOwnedSkinId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("price-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const selectedWeaponId = weapons.find((w) => w.name.toLowerCase() === selectedWeaponSlug)?.id;
  const selectedTierName = tiers.find((t) => t.name.toLowerCase() === selectedTierSlug)?.name;

  function selectWeapon(weapon: Weapon | null) {
    const slug = weapon ? weapon.name.toLowerCase() : null;
    setSelectedWeaponSlug(slug);
    setFilterParam("weapon", slug);
  }

  function selectTier(tier: ContentTierOption | null) {
    const slug = tier ? tier.name.toLowerCase() : null;
    setSelectedTierSlug(slug);
    setFilterParam("tier", slug);
  }

  function dismissUnreviewedOwnedFilter() {
    setUnreviewedOwnedFilter(false);
    setFilterParam("filter", null);
  }

  // Debounce typed search so every keystroke doesn't fire its own request —
  // same "schedule it, clean it up" shape as the home page's search box.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // --- Pagination state -------------------------------------------------
  const [loadedSkins, setLoadedSkins] = useState<SkinSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Guards against a slow, now-stale request overwriting a newer one — e.g.
  // switching weapons quickly, where the first request's response arrives
  // after the second one already reset the list.
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const requestId = ++requestIdRef.current;
      if (cursor === null) setIsLoadingInitial(true);
      else setIsLoadingMore(true);

      const params = new URLSearchParams();
      if (selectedWeaponId) params.set("weaponId", selectedWeaponId);
      if (selectedTierName) params.set("tierName", selectedTierName);
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
      if (unreviewedOwnedFilter) params.set("filter", "unreviewed-owned");
      params.set("sort", sortBy);
      if (cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/skins/catalog?${params.toString()}`);
        if (!res.ok) throw new Error("Request failed");
        const data: { skins: SkinSummary[]; nextCursor: string | null } = await res.json();

        if (requestId !== requestIdRef.current) return; // superseded by a newer request

        setLoadedSkins((prev) => (cursor === null ? data.skins : [...prev, ...data.skins]));
        setNextCursor(data.nextCursor);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setErrorMessage("Something went wrong loading skins — please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoadingInitial(false);
          setIsLoadingMore(false);
        }
      }
    },
    [selectedWeaponId, selectedTierName, debouncedSearchQuery, sortBy, unreviewedOwnedFilter]
  );

  // Any filter change resets to page 1 rather than appending — the old
  // results no longer match what's being asked for. The reset itself
  // happens during render (comparing against the filter key applied last
  // render) rather than in the effect below, so React can apply it in the
  // same commit instead of rendering once with stale skins and only
  // clearing them a tick later.
  const filterKey = `${selectedWeaponId ?? ""}|${selectedTierName ?? ""}|${debouncedSearchQuery}|${sortBy}|${unreviewedOwnedFilter}`;
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey);
  if (filterKey !== appliedFilterKey) {
    setAppliedFilterKey(filterKey);
    setLoadedSkins([]);
    setNextCursor(null);
  }

  useEffect(() => {
    // fetchPage sets isLoadingInitial synchronously before its first await —
    // the same "reset, then fetch" shape React's own docs use for
    // data-fetching effects (see the useEffect reference page's "Fetching
    // data with Effects" example, which calls setBio(null) synchronously
    // for the same reason). The linter can't tell that apart from a
    // genuinely unnecessary render, so it's disabled here rather than
    // deferring the flag update just to satisfy the rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(null);
  }, [fetchPage]);

  // Infinite scroll: a sentinel element sits just past the last loaded
  // card; once it scrolls into view, fetch the next page using the cursor
  // from the previous one. `rootMargin` fires this a bit before the
  // sentinel is actually on screen, so the next page is usually ready
  // before the user reaches the bottom.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!nextCursor || isLoadingInitial) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          fetchPage(nextCursor);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingInitial, isLoadingMore, fetchPage]);

  async function toggleOwnership(skinId: string) {
    const isOwned = ownedSkinIds.has(skinId);
    setPendingOwnershipSkinId(skinId);
    setErrorMessage(null);
    if (isOwned) setJustOwnedSkinId(null);

    setOwnedSkinIds((prev) => {
      const next = new Set(prev);
      if (isOwned) next.delete(skinId);
      else next.add(skinId);
      return next;
    });

    try {
      const res = isOwned
        ? await fetch(`/api/me/collection/${skinId}`, { method: "DELETE" })
        : await fetch("/api/me/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
          });

      if (!res.ok) throw new Error("Request failed");
      if (!isOwned) setJustOwnedSkinId(skinId);
    } catch {
      // Roll back the optimistic update on failure.
      setOwnedSkinIds((prev) => {
        const next = new Set(prev);
        if (isOwned) next.add(skinId);
        else next.delete(skinId);
        return next;
      });
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingOwnershipSkinId(null);
    }
  }

  // Fully independent of toggleOwnership — a skin can be liked, owned, both,
  // or neither. Liking carries no score/rating (see SPEC.md section 15):
  // it's a separate "do I want this" signal, not a quality judgment, so it
  // gets its own state and its own API route (still /api/me/wishlist under
  // the hood — the "like" framing is a UI reframe, not a schema change).
  // State lives directly on each loaded skin (rather than a separate id Set,
  // unlike ownership) since likeCount needs to move in lockstep with it.
  async function toggleLike(skinId: string) {
    const skin = loadedSkins.find((s) => s.id === skinId);
    if (!skin) return;
    const wasLiked = skin.isLikedByViewer;

    setPendingLikeSkinId(skinId);
    setErrorMessage(null);
    setLoadedSkins((prev) =>
      prev.map((s) =>
        s.id === skinId
          ? { ...s, isLikedByViewer: !wasLiked, likeCount: s.likeCount + (wasLiked ? -1 : 1) }
          : s
      )
    );

    try {
      const res = wasLiked
        ? await fetch(`/api/me/wishlist/${skinId}`, { method: "DELETE" })
        : await fetch("/api/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
          });

      if (!res.ok) throw new Error("Request failed");
    } catch {
      setLoadedSkins((prev) =>
        prev.map((s) =>
          s.id === skinId
            ? { ...s, isLikedByViewer: wasLiked, likeCount: s.likeCount + (wasLiked ? 1 : -1) }
            : s
        )
      );
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingLikeSkinId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="sticky top-14 z-10 flex flex-col gap-3 border-b border-border-subtle/80 bg-background/90 py-3 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h1 className="font-display text-xl font-bold">Skin Catalog</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-lg font-medium">
            Total value:{" "}
            <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
              {totalValue.toLocaleString()} VP
            </span>
          </div>
          <Link
            href="/collection"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            My collection →
          </Link>
          <Link
            href="/wishlist"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            My liked skins →
          </Link>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      {unreviewedOwnedFilter && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <span>Showing skins you own but haven&apos;t reviewed yet</span>
          <button
            type="button"
            onClick={dismissUnreviewedOwnedFilter}
            aria-label="Clear filter"
            className="cursor-pointer rounded-full p-1 text-accent transition-colors hover:bg-accent/15"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative w-full max-w-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search skin names..."
          className="w-full rounded-full border border-border-subtle bg-surface py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {/* Filter rows, stacked loosest-to-tightest: weapon is the primary,
          always-visible, full-width control (this is a task-oriented tool
          for building out a collection weapon-by-weapon); tier is a
          secondary, lighter-weight refinement underneath it. Any future
          filter (skin line, has-chromas) is just another row appended
          here — nothing above needs to change shape to fit it. */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => selectWeapon(null)}
            className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedWeaponSlug === null
                ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                : "border-border-subtle text-zinc-300 hover:bg-surface"
            }`}
          >
            All Weapons
          </button>
          {weapons.map((weapon) => (
            <button
              key={weapon.id}
              onClick={() => selectWeapon(weapon)}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                weapon.name.toLowerCase() === selectedWeaponSlug
                  ? "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white"
                  : "border-border-subtle text-zinc-300 hover:bg-surface"
              }`}
            >
              {weapon.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="pr-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Tier
            </span>
            <button
              onClick={() => selectTier(null)}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTierSlug === null
                  ? "border-transparent bg-surface-2 text-foreground"
                  : "border-border-subtle text-zinc-400 hover:border-zinc-600"
              }`}
            >
              All
            </button>
            {tiers.map((tier) => {
              const style = getTierStyle(tier.name);
              const isActive = tier.name.toLowerCase() === selectedTierSlug;
              return (
                <button
                  key={tier.id}
                  onClick={() => selectTier(tier)}
                  title={`${tier.vpPrice.toLocaleString()} VP`}
                  className={`cursor-pointer whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? `border-transparent bg-surface-2 ${style.text}`
                      : "border-border-subtle text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {tier.name}
                </button>
              );
            })}
          </div>

          <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-400">
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="cursor-pointer rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoadingInitial ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3"
            >
              <div className="h-20 w-full animate-pulse rounded-lg bg-surface-2" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-2" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-2" />
              <div className="h-7 w-full animate-pulse rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      ) : loadedSkins.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {debouncedSearchQuery
            ? `No skins match "${debouncedSearchQuery}".`
            : "No skins match the current filters."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {loadedSkins.map((skin) => {
              const owned = ownedSkinIds.has(skin.id);
              const tier = getTierStyle(skin.contentTier.name);
              return (
                <div
                  key={skin.id}
                  className={`group flex flex-col gap-2 rounded-2xl border bg-surface p-3 transition-all ${
                    owned
                      ? `border-transparent ${tier.ringGlow}`
                      : "border-border-subtle hover:border-zinc-600"
                  }`}
                >
                  {/* The heart sits as a sibling of the Link (not nested
                      inside it) so tapping it doesn't also trigger
                      navigation — the click handler still calls
                      preventDefault/stopPropagation as a second layer of
                      protection, since this <div> isn't itself a link. */}
                  <div className="relative h-20 w-full rounded-lg bg-surface-2">
                    <Link href={`/skins/${skin.id}`}>
                      <Image
                        src={skin.imageUrl}
                        alt={skin.name}
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                        sizes="200px"
                      />
                    </Link>
                    <HeartButton
                      variant="overlay"
                      liked={skin.isLikedByViewer}
                      count={skin.likeCount}
                      pending={pendingLikeSkinId === skin.id}
                      isLoggedIn
                      onToggle={() => toggleLike(skin.id)}
                      className="absolute bottom-1 right-1"
                    />
                  </div>
                  <Link href={`/skins/${skin.id}`} className="flex flex-col gap-2">
                    <div className="truncate text-sm font-medium hover:underline">
                      {skin.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <div className="relative h-3.5 w-3.5 shrink-0">
                        <Image
                          src={skin.contentTier.iconUrl}
                          alt={skin.contentTier.name}
                          fill
                          className="object-contain"
                          sizes="14px"
                        />
                      </div>
                      <span className={tier.text}>{skin.contentTier.name}</span> ·{" "}
                      {getSkinPrice(skin).toLocaleString()} VP
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleOwnership(skin.id)}
                    disabled={pendingOwnershipSkinId === skin.id}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors disabled:opacity-50 ${
                      owned
                        ? "bg-surface-2 text-zinc-300 hover:bg-red-500/10 hover:text-red-400"
                        : "bg-gradient-to-r from-accent to-accent-strong text-white"
                    }`}
                  >
                    {owned ? "Owned ✓ · tap to remove" : "+ Add to Collection"}
                  </button>
                  {justOwnedSkinId === skin.id && (
                    <Link
                      href={`/skins/${skin.id}`}
                      className="flex items-center justify-between rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                    >
                      You own this — rate it? <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sentinel for the IntersectionObserver above — invisible, just
              a scroll-position marker near the bottom of the loaded list. */}
          {nextCursor && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-accent" />
                  Loading more...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
