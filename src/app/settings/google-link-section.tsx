"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleLogo } from "@/components/google-signin-button";

// Whether the current session already has a Google identity is only known
// client-side (supabase.auth.getUserIdentities() reads the live session, not
// our own `users` table), so this checks on mount rather than being passed
// down from the server component.
export function GoogleLinkSection() {
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUserIdentities();
      if (!cancelled) {
        setHasGoogle(data?.identities.some((i) => i.provider === "google") ?? false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Same PKCE-from-the-browser reasoning as GoogleSignInButton — see that
  // file for why this can't be a Server Action.
  async function connectGoogle() {
    setPending(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings` },
    });
    if (error) {
      setErrorMessage("Something went wrong — please try again.");
      setPending(false);
    }
  }

  if (hasGoogle === null) {
    return <p className="text-sm text-zinc-500">Checking connected accounts...</p>;
  }

  if (hasGoogle) {
    return <p className="text-sm font-medium text-emerald-400">✓ Google account connected</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={connectGoogle}
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        {pending ? "Redirecting to Google..." : "Connect Google account"}
      </button>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
