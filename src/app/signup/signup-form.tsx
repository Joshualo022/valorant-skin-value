"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = undefined;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

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
          minLength={6}
          className="border rounded px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.message && <p className="text-green-700 text-sm">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Signing up..." : "Sign up"}
      </button>
      <p className="text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
