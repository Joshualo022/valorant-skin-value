import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureShareSlug } from "@/lib/share-slug";

// Reads the current Supabase Auth session (if any) and returns the matching
// row from our own `users` table, creating it on first sight. Safe to call
// on every request that needs to know who's logged in.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const { sub: id, email } = data.claims;
  if (!email) {
    return null;
  }

  const user = await prisma.user.upsert({
    where: { id },
    update: {},
    // displayName starts null on purpose — that's what triggers the
    // first-login "choose a display name" interstitial (see layout.tsx).
    create: { id, email },
  });

  // Backfills slugs for accounts created before /u/:slug existed, one login
  // at a time — cheaper than a one-off migration script, and self-heals as
  // people sign back in. Only costs an extra query for users who don't have
  // one yet.
  if (!user.collectionShareSlug) {
    user.collectionShareSlug = await ensureShareSlug(user.id);
  }

  return user;
}
