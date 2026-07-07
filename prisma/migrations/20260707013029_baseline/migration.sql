-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('self_reported');

-- CreateEnum
CREATE TYPE "review_tag_type" AS ENUM ('great_design', 'clunky_design', 'great_sound', 'weak_sound', 'great_vfx', 'weak_vfx', 'great_feel', 'clunky_feel', 'underrated', 'overrated');

-- CreateEnum
CREATE TYPE "flag_status" AS ENUM ('pending', 'resolved');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weapon_type" TEXT NOT NULL,

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skin_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vp_price" INTEGER NOT NULL,
    "icon_url" TEXT NOT NULL,

    CONSTRAINT "content_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weapon_id" TEXT NOT NULL,
    "skin_line_id" TEXT,
    "content_tier_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "riot_content_id" TEXT NOT NULL,

    CONSTRAINT "skins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chromas" (
    "id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "chromas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_owned_skins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "chroma_id" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_owned_skins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_loadout" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weapon_id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "chroma_id" TEXT,

    CONSTRAINT "active_loadout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "value_score" INTEGER NOT NULL,
    "would_rebuy" BOOLEAN NOT NULL,
    "review_text" TEXT,
    "verification_status" "verification_status" NOT NULL DEFAULT 'self_reported',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tags" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "tag" "review_tag_type" NOT NULL,

    CONSTRAINT "review_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_flags" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "flagged_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "flag_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "weapons_name_key" ON "weapons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skin_lines_name_key" ON "skin_lines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "content_tiers_name_key" ON "content_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skins_riot_content_id_key" ON "skins"("riot_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "chromas_skin_id_name_key" ON "chromas"("skin_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_owned_skins_user_id_skin_id_key" ON "user_owned_skins"("user_id", "skin_id");

-- CreateIndex
CREATE UNIQUE INDEX "active_loadout_user_id_weapon_id_key" ON "active_loadout"("user_id", "weapon_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_skin_id_key" ON "wishlists"("user_id", "skin_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_skin_id_key" ON "reviews"("user_id", "skin_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_tags_review_id_tag_key" ON "review_tags"("review_id", "tag");

-- AddForeignKey
ALTER TABLE "skins" ADD CONSTRAINT "skins_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skins" ADD CONSTRAINT "skins_skin_line_id_fkey" FOREIGN KEY ("skin_line_id") REFERENCES "skin_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skins" ADD CONSTRAINT "skins_content_tier_id_fkey" FOREIGN KEY ("content_tier_id") REFERENCES "content_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chromas" ADD CONSTRAINT "chromas_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_owned_skins" ADD CONSTRAINT "user_owned_skins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_owned_skins" ADD CONSTRAINT "user_owned_skins_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_owned_skins" ADD CONSTRAINT "user_owned_skins_chroma_id_fkey" FOREIGN KEY ("chroma_id") REFERENCES "chromas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_loadout" ADD CONSTRAINT "active_loadout_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_loadout" ADD CONSTRAINT "active_loadout_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_loadout" ADD CONSTRAINT "active_loadout_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_loadout" ADD CONSTRAINT "active_loadout_chroma_id_fkey" FOREIGN KEY ("chroma_id") REFERENCES "chromas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

