"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function DisplayNameForm({ initialDisplayName }: { initialDisplayName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialDisplayName);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setErrorMessage(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSaved(true);
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="displayName" className="text-sm text-zinc-400">
        Display name
      </label>
      <div className="flex gap-2">
        <input
          id="displayName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={30}
          className="flex-1 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="shrink-0 cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
      {saved && !errorMessage && <p className="text-sm text-emerald-400">Saved.</p>}
    </form>
  );
}
