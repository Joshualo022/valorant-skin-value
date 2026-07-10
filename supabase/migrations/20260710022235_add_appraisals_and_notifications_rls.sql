-- RLS for the new collection_appraisals and notifications tables (social
-- layer phase 2). Same casting rule as 20260706000000_enable_rls_policies.sql:
-- from_user_id/to_user_id/user_id are Prisma `text`, auth.uid() is `uuid`, so
-- every comparison casts auth.uid() to text.
--
-- Apply with:
--   npx prisma db execute --file supabase/migrations/20260710022235_add_appraisals_and_notifications_rls.sql

-- =========================================================================
-- collection_appraisals
-- =========================================================================
-- Appraisal counts are public (shown on any visible shared collection page),
-- so select has no `to` clause. Split from insert/delete same as follows:
-- the read rule (everyone) and write rule (own rows only, as the giver)
-- aren't the same audience.

alter table collection_appraisals enable row level security;

create policy "collection_appraisals_select_all" on collection_appraisals
  for select
  using (true);

create policy "collection_appraisals_insert_own" on collection_appraisals
  for insert to authenticated
  with check (auth.uid()::text = from_user_id);

create policy "collection_appraisals_delete_own" on collection_appraisals
  for delete to authenticated
  using (auth.uid()::text = from_user_id);

-- =========================================================================
-- notifications
-- =========================================================================
-- Unlike the tables above, notifications are private — only the recipient
-- may read their own. The app creates rows server-side via the BYPASSRLS
-- role (same as every other write in this project), so no insert policy is
-- needed for the authenticated role; recipients can update (mark read) their
-- own rows.

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select to authenticated
  using (auth.uid()::text = user_id);

create policy "notifications_update_own" on notifications
  for update to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
