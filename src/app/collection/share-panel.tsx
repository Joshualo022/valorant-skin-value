"use client";

import { useState } from "react";
import Image from "next/image";
import { getTierStyle } from "@/lib/tier-style";
import type { FullOwnedSkin } from "./all-owned-skins-grid";

type Visibility = "PRIVATE" | "LINK";

// `origin` is passed down from the server (see collection/page.tsx) instead
// of read from window.location here, so the first client render always
// matches what the server already sent — no hydration mismatch.
//
// Self-contained trigger + modal (same pattern as u/[slug]/flex-item-card.tsx):
// everything that configures *presentation to others* — visibility, the
// share link, the flex item — lives behind this one "Share" button instead
// of sitting permanently in the page body. Existing endpoints
// (PATCH /api/me/visibility, PUT/DELETE /api/me/flex-item) are unchanged;
// this is a UI relocation only.
export function SharePopover({
  initialVisibility,
  initialSlug,
  origin,
  ownedSkins,
  initialFlexItemSkinId,
}: {
  initialVisibility: Visibility;
  initialSlug: string | null;
  origin: string;
  ownedSkins: FullOwnedSkin[];
  initialFlexItemSkinId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [slug, setSlug] = useState(initialSlug);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flexItemSkinId, setFlexItemSkinId] = useState(initialFlexItemSkinId);
  const [flexItemPending, setFlexItemPending] = useState<string | null>(null);

  const shareUrl = slug ? `${origin}/u/${slug}` : null;

  async function selectVisibility(next: Visibility) {
    if (next === visibility) return;
    const previous = visibility;
    setPending(true);
    setErrorMessage(null);
    setVisibility(next);

    try {
      const res = await fetch("/api/me/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { visibility: Visibility; slug: string | null };
      setVisibility(data.visibility);
      setSlug(data.slug);
    } catch {
      setVisibility(previous);
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function chooseFlexItem(skinId: string) {
    const previous = flexItemSkinId;
    const next = previous === skinId ? null : skinId;
    setFlexItemPending(skinId);
    setErrorMessage(null);
    setFlexItemSkinId(next);

    try {
      const res = await fetch("/api/me/flex-item", {
        method: next ? "PUT" : "DELETE",
        headers: next ? { "Content-Type": "application/json" } : undefined,
        body: next ? JSON.stringify({ skinId: next }) : undefined,
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setFlexItemSkinId(previous);
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setFlexItemPending(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
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
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5 15.4 17.5" />
          <path d="M15.4 6.5 8.6 10.5" />
        </svg>
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Share your collection</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Collection visibility</div>
              <div className="flex gap-1 rounded-full border border-border-subtle bg-surface-2 p-1 text-sm">
                <button
                  onClick={() => selectVisibility("PRIVATE")}
                  disabled={pending}
                  className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    visibility === "PRIVATE" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
                  }`}
                >
                  Private
                </button>
                <button
                  onClick={() => selectVisibility("LINK")}
                  disabled={pending}
                  className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    visibility === "LINK" ? "bg-accent text-white" : "text-zinc-400 hover:text-foreground"
                  }`}
                >
                  Anyone with link
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                {visibility === "PRIVATE"
                  ? "Only you can see your collection."
                  : "Anyone with your link can see a read-only summary of your collection."}
              </p>
            </div>

            {visibility === "LINK" && shareUrl && (
              <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2">
                <span className="flex-1 truncate text-xs text-zinc-400">{shareUrl}</span>
                <button
                  onClick={copyLink}
                  className="shrink-0 cursor-pointer rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-accent/50"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            {visibility !== "PRIVATE" && ownedSkins.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
                <div>
                  <div className="text-sm font-semibold">Flex item</div>
                  <p className="text-xs text-zinc-500">
                    Pick one owned skin to feature as a large showcase on your share page.
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ownedSkins.map((skin) => {
                    const tier = getTierStyle(skin.contentTier.name);
                    const isSelected = skin.skinId === flexItemSkinId;
                    return (
                      <button
                        key={skin.skinId}
                        onClick={() => chooseFlexItem(skin.skinId)}
                        disabled={flexItemPending === skin.skinId}
                        title={skin.name}
                        className={`relative h-14 w-14 shrink-0 rounded-lg border bg-surface-2 p-1 transition-all disabled:opacity-50 ${
                          isSelected ? `border-transparent ${tier.ringGlow}` : "border-border-subtle hover:border-zinc-600"
                        }`}
                      >
                        <Image src={skin.imageUrl} alt={skin.name} fill className="object-contain p-1" sizes="56px" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMessage && (
              <p role="alert" className="text-xs text-red-500">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
