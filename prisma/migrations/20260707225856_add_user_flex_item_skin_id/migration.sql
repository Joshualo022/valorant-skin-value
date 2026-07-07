-- AlterTable
ALTER TABLE "users" ADD COLUMN     "flex_item_skin_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_flex_item_skin_id_fkey" FOREIGN KEY ("flex_item_skin_id") REFERENCES "skins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
