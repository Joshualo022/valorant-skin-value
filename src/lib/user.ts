// Single source of truth for "what name do we show for this user" — every
// place that used to print a raw email should go through this instead, so a
// user who hasn't picked a display name yet (or skipped the prompt before it
// defaulted their name) never has their raw email exposed to other users.
export function resolveDisplayName(user: { displayName: string | null; email: string }): string {
  return user.displayName ?? user.email.split("@")[0];
}
