-- RLS for the new follows table (social layer phase 1). Same casting rule as
-- 20260706000000_enable_rls_policies.sql: follower_id/following_id are Prisma
-- `text`, auth.uid() is `uuid`, so every comparison casts auth.uid() to text.
--
-- Apply with:
--   npx prisma db execute --file supabase/migrations/20260709171805_add_follows_rls.sql

-- =========================================================================
-- follows
-- =========================================================================
-- Follow relationships are public (follower counts, "who follows whom" are
-- shown on share pages) so select has no `to` clause. Split from
-- insert/delete same as review_likes: the read rule (everyone) and write
-- rule (own rows only, as the follower) aren't the same audience.

alter table follows enable row level security;

create policy "follows_select_all" on follows
  for select
  using (true);

create policy "follows_insert_own" on follows
  for insert to authenticated
  with check (auth.uid()::text = follower_id);

create policy "follows_delete_own" on follows
  for delete to authenticated
  using (auth.uid()::text = follower_id);
