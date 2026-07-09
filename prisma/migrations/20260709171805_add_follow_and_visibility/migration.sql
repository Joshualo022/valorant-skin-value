/*
  Warnings:

  - Added the required column `updated_at` to the `active_loadout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "collection_visibility" AS ENUM ('PRIVATE', 'FOLLOWERS_ONLY', 'LINK');

-- AlterTable
-- DEFAULT CURRENT_TIMESTAMP only backfills existing rows; Prisma's @updatedAt
-- keeps setting this on every future write from the client, same as any other
-- @updatedAt field.
ALTER TABLE "active_loadout" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collection_visibility" "collection_visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: users who already had sharing enabled (a non-null share
-- slug) keep working the same way under the new visibility model — their
-- existing links stay live as LINK visibility. Users with no slug stay
-- PRIVATE (the column default).
UPDATE "users" SET "collection_visibility" = 'LINK' WHERE "collection_share_slug" IS NOT NULL;
