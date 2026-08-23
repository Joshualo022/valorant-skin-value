"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthFormState = { error?: string; message?: string } | undefined;

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Keyed by IP since there's no user yet — caps scripted mass account
  // creation. Supabase Auth also rate-limits its own endpoints, so this is a
  // second, app-controlled layer. Server actions don't receive the Request,
  // so the IP comes from the forwarded header via next/headers.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit("signup", ip);
  if (!limit.ok) {
    return { error: "Too many signup attempts — please wait a bit and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is required, signUp() succeeds but doesn't
  // return a session yet — the user isn't logged in until they click the
  // confirmation link.
  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
