import { randomBytes } from "crypto";

// Excludes visually ambiguous characters (0/O, 1/l/I) since this slug shows
// up in a URL people might read aloud or retype.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateShareSlug(length = 10): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return slug;
}
