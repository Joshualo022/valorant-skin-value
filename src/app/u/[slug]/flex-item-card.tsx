"use client";

import { useState } from "react";
import Image from "next/image";
import { getTierStyle } from "@/lib/tier-style";
import { getSkinPrice } from "@/lib/pricing";
import { VpAmount } from "@/components/vp-amount";
import type { FullOwnedSkin } from "@/app/collection/owned-skins-utils";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
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
  );
}

// Owner-only interactive version of the flex item hero card — the card
// itself is the edit trigger (a big hover overlay signals that, plus a
// small always-visible corner badge for touch, where hover never fires).
// Non-owners get the plain read-only card in page.tsx instead; this
// component never renders for them, so there's no risk of a stray "edit"
// affordance showing on someone else's profile.
export function FlexItemCard({
  ownedSkins,
  initialFlexItemSkinId,
}: {
  ownedSkins: FullOwnedSkin[];
  initialFlexItemSkinId: string | null;
}) {
  const [flexItemSkinId, setFlexItemSkinId] = useState(initialFlexItemSkinId);
  const [pendingSkinId, setPendingSkinId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFlexItem = ownedSkins.find((s) => s.skinId === flexItemSkinId) ?? null;
  const tier = activeFlexItem ? getTierStyle(activeFlexItem.contentTier.name) : null;

  async function chooseFlexItem(skinId: string) {
    const isDeselecting = flexItemSkinId === skinId;
    setPendingSkinId(skinId);
    setErrorMessage(null);

    try {
      const res = isDeselecting
        ? await fetch("/api/me/flex-item", { method: "DELETE" })
        : await fetch("/api/me/flex-item", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
          });
      if (!res.ok) throw new Error("Request failed");
      setFlexItemSkinId(isDeselecting ? null : skinId);
      setModalOpen(false);
    } catch {
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingSkinId(null);
    }
  }

  return (
    <>
      {activeFlexItem && tier ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`group relative flex min-h-[220px] w-full cursor-pointer items-end overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br ${tier.gradient} p-6 text-left transition-transform hover:scale-[1.01] sm:min-h-[280px]`}
        >
          <div className="absolute inset-0 bg-black/55" />
          <Image
            src={activeFlexItem.imageUrl}
            alt={activeFlexItem.name}
            fill
            className="object-contain object-right p-4 opacity-90 sm:p-2"
            sizes="800px"
          />
          <div className="relative z-10 flex flex-col gap-0.5">
            <span className={`text-xs font-semibold uppercase tracking-wide ${tier.text}`}>
              Flex Item · {activeFlexItem.contentTier.name}
            </span>
            <span className="font-display text-2xl font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)] sm:text-3xl">
              {activeFlexItem.name}
            </span>
            <VpAmount amount={getSkinPrice(activeFlexItem)} className="text-sm text-zinc-300" iconSize={14} />
          </div>

          {/* Big overlay on hover (desktop) */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <EditIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          {/* Small persistent badge — the only affordance touch devices ever
              see, since :hover never fires there. Fades out when the big
              overlay takes over on desktop hover, so they don't stack. */}
          <div className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity group-hover:opacity-0">
            <EditIcon className="h-4 w-4" />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle bg-surface p-6 text-center transition-colors hover:border-accent/50 sm:min-h-[200px]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-zinc-400 transition-colors group-hover:text-accent">
            <EditIcon className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-foreground">Set a flex item</span>
          <span className="max-w-xs text-xs text-zinc-500">
            Pick one owned skin to feature as a showcase on your profile.
          </span>
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Choose your flex item</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {ownedSkins.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Add skins to your collection to pick one as your flex item.
              </p>
            ) : (
              <>
                <p className="text-xs text-zinc-500">
                  Tap a skin to feature it — tap the selected one again to remove it.
                </p>
                <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {ownedSkins.map((skin) => {
                    const skinTier = getTierStyle(skin.contentTier.name);
                    const isSelected = skin.skinId === flexItemSkinId;
                    return (
                      <button
                        key={skin.skinId}
                        type="button"
                        onClick={() => chooseFlexItem(skin.skinId)}
                        disabled={pendingSkinId === skin.skinId}
                        aria-pressed={isSelected}
                        title={skin.name}
                        className={`relative flex flex-col gap-1 rounded-xl border bg-surface-2 p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSelected
                            ? `border-transparent ${skinTier.ringGlow}`
                            : "border-border-subtle hover:border-zinc-600"
                        }`}
                      >
                        <div className="relative h-12 w-full">
                          <Image src={skin.imageUrl} alt={skin.name} fill className="object-contain" sizes="120px" />
                        </div>
                        <span className="truncate text-[10px] font-medium text-zinc-300">{skin.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
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
