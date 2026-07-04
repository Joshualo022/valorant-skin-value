"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SearchResult = {
  id: string;
  name: string;
  imageUrl: string;
  weapon: { name: string };
};

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/skins/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        setResults(json.skins ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for a skin to see its reviews..."
        className="w-full rounded-full border border-zinc-700 bg-black px-6 py-4 text-lg text-zinc-200 placeholder:text-zinc-500"
        autoFocus
      />

      {query.trim() && (
        <div className="flex flex-col rounded-lg border border-zinc-800 bg-black text-left">
          {loading ? (
            <p className="p-4 text-sm text-zinc-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No skins found.</p>
          ) : (
            results.map((skin) => (
              <Link
                key={skin.id}
                href={`/skins/${skin.id}`}
                className="flex items-center gap-3 border-b border-zinc-800 p-3 last:border-b-0 hover:bg-zinc-900"
              >
                <div className="relative h-10 w-16 shrink-0">
                  <Image
                    src={skin.imageUrl}
                    alt={skin.name}
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{skin.name}</span>
                  <span className="text-xs text-zinc-400">{skin.weapon.name}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
