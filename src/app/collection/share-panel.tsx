"use client";

import { useState } from "react";
import Image from "next/image";
import { getTierStyle } from "@/lib/tier-style";
import type { FullOwnedSkin } from "./all-owned-skins-grid";

type Visibility = "PRIVATE" | "LINK";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "PRIVATE", label: "Private", description: "Only you can see your collection" },
  { value: "LINK", label: "Anyone with link", description: "Anyone with your link can see your collection" },
];

// `origin` is passed down from the server (see collection/page.tsx) instead
// of read from window.location here, so the first client render always
// matches what the server already sent — no hydration mismatch.
export function SharePanel({
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
  const [visibility, setVisibility] = useState(initialVisibility);
  const [slug, setSlug] = useState(initialSlug);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flexItemSkinId, setFlexItemSkinId] = useState(initialFlexItemSkinId);
  const [flexItemPending, setFlexItemPending] = useState<string | null>(null);

  const shareUrl = slug ? `${origin}/collection/${slug}` : null;

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
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
      <div>
        <div className="text-sm font-semibold">Collection visibility</div>
        <p className="text-xs text-zinc-500">Choose who can see a read-only summary of your collection.</p>
      </div>

      <div className="flex flex-col gap-2">
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => selectVisibility(option.value)}
            disabled={pending}
            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              visibility === option.value
                ? "border-accent/60 bg-accent/10"
                : "border-border-subtle bg-surface-2 hover:border-zinc-600"
            }`}
          >
            <span className="text-sm font-semibold text-foreground">{option.label}</span>
            <span className="text-xs text-zinc-500">{option.description}</span>
          </button>
        ))}
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
  );
}
