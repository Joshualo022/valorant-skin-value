"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="border rounded px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
