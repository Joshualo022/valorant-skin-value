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
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for a skin to see its reviews..."
          className="w-full rounded-full border border-border-subtle bg-surface py-4 pl-12 pr-6 text-lg text-foreground placeholder:text-zinc-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          autoFocus
        />
      </div>

      {query.trim() && (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface text-left">
          {loading ? (
            <p className="p-4 text-sm text-zinc-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No skins found.</p>
          ) : (
            results.map((skin) => (
              <Link
                key={skin.id}
                href={`/skins/${skin.id}`}
                className="flex items-center gap-3 border-b border-border-subtle p-3 last:border-b-0 hover:bg-surface-2"
              >
                <div className="relative h-10 w-16 shrink-0 rounded-lg bg-surface-2">
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
