"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type AuthFormState } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/google-signin-button";

const initialState: AuthFormState = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  // Set by /auth/callback when the OAuth code exchange fails (expired link,
  // provider error, etc.) — see that route for when this actually fires.
  const oauthFailed = useSearchParams().get("error") === "oauth";

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <GoogleSignInButton />
      {oauthFailed && (
        <p role="alert" className="text-sm text-red-500">
          Something went wrong signing in with Google — please try again.
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="h-px flex-1 bg-border-subtle" />
        or
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-zinc-400">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-zinc-400">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-red-500">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
