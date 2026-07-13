import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

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

// Every user needs a slug so their /u/:slug profile always resolves,
// regardless of collectionVisibility — this used to be generated only when a
// user opted into LINK sharing (see api/me/visibility). Collisions are
// astronomically unlikely at this alphabet/length, but retry against the
// unique constraint a few times rather than assuming that.
export async function ensureShareSlug(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { collectionShareSlug: generateShareSlug() },
      });
      return updated.collectionShareSlug!;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique share slug");
}
