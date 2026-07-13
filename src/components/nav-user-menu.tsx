"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export function NavUserMenu({
  displayName,
  email,
  profileSlug,
}: {
  displayName: string;
  email: string;
  profileSlug: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Profile menu"
        className="ml-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-white"
      >
        {displayName[0]?.toUpperCase() ?? "?"}
      </button>

      {open && (
        <>
          {/* Click-outside-to-close backdrop, invisible and beneath the panel. */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 flex flex-col gap-1 rounded-2xl border border-border-subtle bg-surface p-2 shadow-lg">
            <div className="px-2 py-1.5">
              <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
              <div className="truncate text-xs text-zinc-500">{email}</div>
            </div>
            <div className="h-px bg-border-subtle" />
            {profileSlug && (
              <Link
                href={`/u/${profileSlug}`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                View profile
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="rounded-xl px-2 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Settings
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full cursor-pointer rounded-xl px-2 py-1.5 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
