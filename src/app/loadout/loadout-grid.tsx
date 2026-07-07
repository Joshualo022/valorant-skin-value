"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import type { LoadoutSlot, LoadoutChroma } from "@/lib/loadout";
import { LOADOUT_COLUMNS, LOADOUT_GROUP_LABELS } from "@/lib/weapon-order";

export function LoadoutGrid({ slots: initialSlots }: { slots: LoadoutSlot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [openWeaponId, setOpenWeaponId] = useState<string | null>(null);
  const [pendingWeaponId, setPendingWeaponId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const openCardRef = useRef<HTMLDivElement | null>(null);

  // Close the chroma picker on any click outside the currently-open card (the
  // ref spans the toggle button and the popover together, so re-clicking the
  // same card to close it doesn't get treated as an "outside" click).
  useEffect(() => {
    if (!openWeaponId) return;
    function handleClick(e: MouseEvent) {
      if (openCardRef.current && !openCardRef.current.contains(e.target as Node)) {
        setOpenWeaponId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openWeaponId]);

  const slotsByType = new Map<string, LoadoutSlot[]>();
  for (const slot of slots) {
    const list = slotsByType.get(slot.weapon.weaponType) ?? [];
    list.push(slot);
    slotsByType.set(slot.weapon.weaponType, list);
  }

  async function selectChroma(weaponId: string, skinId: string, chroma: LoadoutChroma) {
    const previous = slots.find((s) => s.weapon.id === weaponId)?.chroma ?? null;
    setPendingWeaponId(weaponId);
    setErrorMessage(null);
    setSlots((prev) => prev.map((s) => (s.weapon.id === weaponId ? { ...s, chroma } : s)));
    setOpenWeaponId(null);

    try {
      const res = await fetch(`/api/me/loadout/${weaponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinId, chromaId: chroma.id }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setSlots((prev) => prev.map((s) => (s.weapon.id === weaponId ? { ...s, chroma: previous } : s)));
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPendingWeaponId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0a1518] bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.07),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(20,90,100,0.1),transparent_50%)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-1 font-display text-2xl font-bold uppercase tracking-widest text-teal-100">
          Loadout
        </h1>
        <p className="mb-6 text-sm text-teal-400/60">
          Your active loadout, one skin per weapon. Click an equipped card to switch chromas.
        </p>

        {errorMessage && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {LOADOUT_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-8">
              {column.map((weaponType) => {
                const groupSlots = slotsByType.get(weaponType) ?? [];
                if (groupSlots.length === 0) return null;
                return (
                  <div key={weaponType} className="flex flex-col gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300/90">
                      {LOADOUT_GROUP_LABELS[weaponType] ?? weaponType}
                    </h2>
                    <div className="flex flex-col gap-2">
                      {groupSlots.map((slot) => (
                        <WeaponSlotCard
                          key={slot.weapon.id}
                          slot={slot}
                          isOpen={openWeaponId === slot.weapon.id}
                          isPending={pendingWeaponId === slot.weapon.id}
                          cardRef={openWeaponId === slot.weapon.id ? openCardRef : undefined}
                          onToggle={() =>
                            setOpenWeaponId((prev) => (prev === slot.weapon.id ? null : slot.weapon.id))
                          }
                          onSelectChroma={(chroma) =>
                            slot.skin && selectChroma(slot.weapon.id, slot.skin.id, chroma)
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeaponSlotCard({
  slot,
  isOpen,
  isPending,
  cardRef,
  onToggle,
  onSelectChroma,
}: {
  slot: LoadoutSlot;
  isOpen: boolean;
  isPending: boolean;
  cardRef?: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onSelectChroma: (chroma: LoadoutChroma) => void;
}) {
  const { weapon, skin, chroma, chromas } = slot;

  if (!skin) {
    return (
      <div className="relative flex h-20 w-full items-end overflow-hidden rounded-md border border-dashed border-slate-700/70 bg-slate-950/40 p-2">
        {weapon.killfeedIconUrl && (
          <Image
            src={weapon.killfeedIconUrl}
            alt=""
            fill
            className="object-contain p-5 opacity-30"
            sizes="220px"
          />
        )}
        <span className="relative z-10 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {weapon.name}
        </span>
      </div>
    );
  }

  const imageUrl = chroma?.imageUrl ?? skin.imageUrl;
  const hasChromas = chromas.length > 0;

  const cardImage = (
    <Image
      src={imageUrl}
      alt={skin.name}
      fill
      className="object-contain p-2 transition-transform group-hover:scale-105"
      sizes="220px"
    />
  );
  const cardLabel = (
    <span className="relative z-10 text-[10px] font-semibold uppercase tracking-wide text-teal-50 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
      {weapon.name}
    </span>
  );

  if (!hasChromas) {
    return (
      <div className="relative flex h-20 w-full items-end overflow-hidden rounded-md border border-teal-900/50 bg-slate-900/70 p-2">
        {cardImage}
        {cardLabel}
      </div>
    );
  }

  return (
    <div className="relative" ref={cardRef}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={`group relative flex h-20 w-full items-end overflow-hidden rounded-md border bg-slate-900/70 p-2 text-left transition-colors disabled:opacity-60 ${
          isOpen ? "border-teal-400/70" : "border-teal-900/50 hover:border-teal-500/60"
        }`}
      >
        {cardImage}
        {cardLabel}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-lg border border-teal-800/60 bg-slate-900 p-3 shadow-xl shadow-black/50">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
            Chromas
          </div>
          <div className="flex flex-wrap gap-2">
            {chromas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectChroma(c)}
                title={c.name}
                className={`relative h-10 w-10 shrink-0 rounded-md border bg-slate-800 p-1 transition-colors ${
                  c.id === chroma?.id ? "border-teal-400" : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <Image src={c.swatchUrl} alt={c.name} fill className="object-contain" sizes="40px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
