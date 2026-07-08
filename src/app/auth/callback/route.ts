import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google/Discord/etc. never redirect straight back to us — they redirect to
// a fixed URL registered with Supabase itself, and Supabase then redirects
// here with its own one-time `code`. exchangeCodeForSession trades that code
// for a real session and writes the session cookie via the server client's
// cookie handlers (see src/lib/supabase/server.ts) before we redirect home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing or invalid code (expired link, provider error, etc.) — send the
  // user back to log in rather than silently landing them on a page that
  // looks logged in but isn't.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
