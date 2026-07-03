import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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

  return prisma.user.upsert({
    where: { id },
    update: {},
    create: { id, email, displayName: email.split("@")[0] },
  });
}
