-- RLS for the new review_likes table (Batch 5: Review likes). Same casting
-- rule as 20260706000000_enable_rls_policies.sql: user_id is Prisma `text`,
-- auth.uid() is `uuid`, so every comparison casts auth.uid() to text.
--
-- Apply with:
--   npx prisma db execute --file supabase/migrations/20260708224700_add_review_likes_rls.sql

-- =========================================================================
-- review_likes
-- =========================================================================
-- Like counts are public (shown on every viewer's review list, logged in or
-- not), so select has no `to` clause. Unlike wishlists/user_owned_skins
-- (which get one blanket `for all` policy), likes split select from
-- insert/delete because the read rule (everyone) and write rule
-- (own rows only) aren't the same audience.

alter table review_likes enable row level security;

create policy "review_likes_select_all" on review_likes
  for select
  using (true);

create policy "review_likes_insert_own" on review_likes
  for insert to authenticated
  with check (auth.uid()::text = user_id);

create policy "review_likes_delete_own" on review_likes
  for delete to authenticated
  using (auth.uid()::text = user_id);
