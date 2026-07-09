-- Postgres has no direct DROP VALUE for enums, so removing FOLLOWERS_ONLY
-- means recreating the type: rename the old one out of the way, create the
-- new (smaller) one, repoint the column through it with a USING cast that
-- downgrades any existing FOLLOWERS_ONLY rows to PRIVATE, then drop the old
-- type.

ALTER TYPE "collection_visibility" RENAME TO "collection_visibility_old";

CREATE TYPE "collection_visibility" AS ENUM ('PRIVATE', 'LINK');

ALTER TABLE "users" ALTER COLUMN "collection_visibility" DROP DEFAULT;

ALTER TABLE "users" ALTER COLUMN "collection_visibility" TYPE "collection_visibility" USING (
  CASE WHEN "collection_visibility"::text = 'FOLLOWERS_ONLY' THEN 'PRIVATE' ELSE "collection_visibility"::text END
)::"collection_visibility";

ALTER TABLE "users" ALTER COLUMN "collection_visibility" SET DEFAULT 'PRIVATE';

DROP TYPE "collection_visibility_old";
