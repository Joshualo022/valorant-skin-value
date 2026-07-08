"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Full-screen gate shown in place of the app whenever the logged-in user's
// displayName is still null (see layout.tsx). router.refresh() re-runs the
// server component that decides whether to show this, so a successful save
// or skip makes it disappear without a full page reload.
export function DisplayNameInterstitial({ email }: { email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save(displayName: string) {
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong — please try again.");
      setPending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    save(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-display text-xl font-bold">Choose a display name</h1>
          <p className="text-sm text-zinc-400">
            This is what other users will see instead of your email.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder={email.split("@")[0]}
            className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
          />
          {errorMessage && (
            <p role="alert" className="text-sm text-red-500">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => save(email.split("@")[0])}
            disabled={pending}
            className="cursor-pointer text-sm text-zinc-400 underline hover:text-foreground disabled:opacity-50"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
