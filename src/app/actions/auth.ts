"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

// Kicks off the Google OAuth flow. signInWithOAuth doesn't sign anyone in by
// itself — it just asks Supabase to build the Google authorization URL (it
// needs the Google Client ID/Secret configured in the Supabase dashboard,
// not here). We hand that URL back to redirect(), which sends the browser's
// *next* request to Google instead of back into our own app. See the
// /auth/callback route for the other end of this round trip.
export async function signInWithGoogle() {
  const supabase = await createClient();

  // Same absolute-URL construction as the collection share link (see
  // src/app/collection/page.tsx) — Google will only redirect to an exact,
  // pre-registered URL, so this can't be a relative path.
  const host = (await headers()).get("host");
  const origin = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
