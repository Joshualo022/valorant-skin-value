-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collection_share_slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_collection_share_slug_key" ON "users"("collection_share_slug");
