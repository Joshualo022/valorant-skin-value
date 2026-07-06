"use client";

import { useState } from "react";
import Image from "next/image";

type ChromaOption = {
  id: string;
  name: string;
  imageUrl: string;
};

export function SkinImage({
  name,
  defaultImageUrl,
  chromas,
  gradient,
}: {
  name: string;
  defaultImageUrl: string;
  chromas: ChromaOption[];
  gradient: string;
}) {
  // Which image is currently shown — starts on the skin's default art;
  // clicking a swatch just swaps this, no data is refetched.
  const [activeImage, setActiveImage] = useState(defaultImageUrl);
  const [activeName, setActiveName] = useState(name);

  return (
    <div className="flex flex-col gap-2 sm:w-64 sm:shrink-0">
      <div
        className={`relative h-40 w-full shrink-0 rounded-xl bg-gradient-to-br ${gradient} bg-surface-2 p-1 sm:w-64`}
      >
        <div className="relative h-full w-full rounded-lg bg-surface-2">
          <Image
            src={activeImage}
            alt={activeName}
            fill
            className="object-contain p-3"
            sizes="256px"
          />
        </div>
      </div>

      {chromas.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:w-64">
          <button
            type="button"
            onClick={() => {
              setActiveImage(defaultImageUrl);
              setActiveName(name);
            }}
            aria-pressed={activeImage === defaultImageUrl}
            title={name}
            className={`relative h-10 w-10 shrink-0 rounded-lg border bg-surface-2 p-1 transition-colors ${
              activeImage === defaultImageUrl
                ? "border-accent"
                : "border-border-subtle hover:border-zinc-500"
            }`}
          >
            <Image src={defaultImageUrl} alt={name} fill className="object-contain" sizes="40px" />
          </button>
          {chromas.map((chroma) => (
            <button
              key={chroma.id}
              type="button"
              onClick={() => {
                setActiveImage(chroma.imageUrl);
                setActiveName(chroma.name);
              }}
              aria-pressed={activeImage === chroma.imageUrl}
              title={chroma.name}
              className={`relative h-10 w-10 shrink-0 rounded-lg border bg-surface-2 p-1 transition-colors ${
                activeImage === chroma.imageUrl
                  ? "border-accent"
                  : "border-border-subtle hover:border-zinc-500"
              }`}
            >
              <Image
                src={chroma.imageUrl}
                alt={chroma.name}
                fill
                className="object-contain"
                sizes="40px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
