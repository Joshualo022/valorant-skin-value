"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Deliberately calls Supabase from the browser rather than a Server Action.
// signInWithOAuth has to stash a one-time secret (the PKCE "code verifier")
// in a cookie before sending the browser to Google — the /auth/callback
// route needs that same secret back to prove the code Google returns is
// legitimate. Setting that cookie and redirecting to a different origin
// within a single server response is exactly the kind of round trip that
// can silently drop the cookie (proxies, edge networks, etc.). Doing it
// here instead means the cookie is written directly via document.cookie
// and the browser navigates immediately after — no HTTP response in
// between for it to get lost from.
export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // On success, Supabase itself navigates the browser to Google — there's
    // nothing left to do here. We only ever reach this line on failure.
    if (error) {
      setErrorMessage("Something went wrong — please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 font-semibold text-foreground transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        {pending ? "Redirecting to Google..." : "Continue with Google"}
      </button>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.38-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.4l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.6l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75z"
      />
    </svg>
  );
}
