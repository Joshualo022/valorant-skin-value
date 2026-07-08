"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/google-signin-button";

const initialState: AuthFormState = undefined;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {/* There's no separate "sign up with Google" — the first Google
          sign-in already creates the account (see getCurrentUser's upsert
          in src/lib/auth.ts), so this is the exact same button/action as
          the one on the login page. */}
      <GoogleSignInButton />
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
            minLength={6}
            className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-red-500">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="text-sm text-emerald-400">
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Signing up..." : "Sign up"}
        </button>
        <p className="text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-accent underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
