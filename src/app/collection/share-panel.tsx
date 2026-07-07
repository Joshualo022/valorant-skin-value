"use client";

import { useState } from "react";
import Image from "next/image";
import { getTierStyle } from "@/lib/tier-style";
import type { FullOwnedSkin } from "./all-owned-skins-grid";

// `origin` is passed down from the server (see collection/page.tsx) instead
// of read from window.location here, so the first client render always
// matches what the server already sent — no hydration mismatch.
export function SharePanel({
  initialSlug,
  origin,
  ownedSkins,
  initialFlexItemSkinId,
}: {
  initialSlug: string | null;
  origin: string;
  ownedSkins: FullOwnedSkin[];
  initialFlexItemSkinId: string | null;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flexItemSkinId, setFlexItemSkinId] = useState(initialFlexItemSkinId);
  const [flexItemPending, setFlexItemPending] = useState<string | null>(null);

  const shareUrl = slug ? `${origin}/collection/${slug}` : null;

  async function enableSharing() {
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/me/share", { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setSlug(data.slug);
    } catch {
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  async function disableSharing() {
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/me/share", { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setSlug(null);
      setCopied(false);
    } catch {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Share my collection</div>
          <p className="text-xs text-zinc-500">
            {slug
              ? "Anyone with this link can view a read-only summary — it isn't publicly listed or searchable."
              : "Generate an unlisted link to show off your collection — off by default, and only visible to people you send it to."}
          </p>
        </div>
        <button
          onClick={slug ? disableSharing : enableSharing}
          disabled={pending}
          className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            slug
              ? "border-border-subtle text-zinc-300 hover:border-red-500/50 hover:text-red-400"
              : "border-transparent bg-gradient-to-r from-accent to-accent-strong text-white hover:brightness-110"
          }`}
        >
          {pending ? "Working…" : slug ? "Stop sharing" : "Share my collection"}
        </button>
      </div>
      {slug && shareUrl && (
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
      {slug && ownedSkins.length > 0 && (
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
