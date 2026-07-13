"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CHARACTER_COMPONENTS } from "@/components/avatars/characters";
import {
  CHARACTER_IDS,
  CHARACTER_LABELS,
  COLOR_IDS,
  AVATAR_COLORS,
  parseAvatarId,
  type CharacterId,
} from "@/lib/avatars";

// Two-step picker (character, then color) rather than a flat 6x5 grid —
// 30 tap targets at once is a lot for a settings page; picking the
// character first also doubles as "which shape do I like" before "which
// color," a more natural order than scanning all 30 combos flat.
export function AvatarPicker({
  displayName,
  initialAvatarId,
}: {
  displayName: string;
  initialAvatarId: string | null;
}) {
  const router = useRouter();
  const initialParsed = initialAvatarId ? parseAvatarId(initialAvatarId) : null;
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(
    initialParsed?.character ?? CHARACTER_IDS[0]
  );
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save(next: string | null) {
    const previous = avatarId;
    setPending(true);
    setErrorMessage(null);
    setAvatarId(next);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: next }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.refresh();
    } catch {
      setAvatarId(previous);
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  const PreviewCharacter = CHARACTER_COMPONENTS[selectedCharacter];
  const savedCharacter = parseAvatarId(avatarId ?? "")?.character;
  const isPreviewingOtherCharacter = avatarId !== null && savedCharacter !== selectedCharacter;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar avatarId={avatarId} displayName={displayName} size="lg" />
        <Avatar avatarId={avatarId} displayName={displayName} size="xs" />
        <p className="text-xs text-zinc-500">
          Large preview (profile) and small preview (comment rows, feed items).
        </p>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">Character</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CHARACTER_IDS.map((character) => {
            const Character = CHARACTER_COMPONENTS[character];
            const isSelected = character === selectedCharacter;
            return (
              <button
                key={character}
                type="button"
                onClick={() => setSelectedCharacter(character)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-colors ${
                  isSelected ? "border-accent bg-accent/10" : "border-border-subtle bg-surface hover:border-zinc-600"
                }`}
              >
                <Character base="#a1a1aa" facet="#d4d4d8" className="h-10 w-10" />
                <span className="text-xs font-medium text-zinc-300">{CHARACTER_LABELS[character]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">Color</div>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_IDS.map((colorId) => {
            const color = AVATAR_COLORS[colorId];
            const candidateId = `${selectedCharacter}-${colorId}`;
            const isSelected = avatarId === candidateId;
            return (
              <button
                key={colorId}
                type="button"
                onClick={() => save(candidateId)}
                disabled={pending}
                aria-pressed={isSelected}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected ? "border-accent bg-accent/10" : "border-border-subtle bg-surface hover:border-zinc-600"
                }`}
              >
                <PreviewCharacter base={color.base} facet={color.facet} className="h-10 w-10" />
                <span className="text-xs font-medium text-zinc-300">{color.label}</span>
              </button>
            );
          })}
        </div>
        {isPreviewingOtherCharacter && (
          <p className="mt-1 text-[11px] text-zinc-600">
            Currently using a different character — pick a color above to switch to {CHARACTER_LABELS[selectedCharacter]}.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => save(null)}
        disabled={pending || avatarId === null}
        className="w-fit cursor-pointer rounded-full border border-border-subtle px-4 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Use letter avatar
      </button>

      {errorMessage && (
        <p role="alert" className="text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
