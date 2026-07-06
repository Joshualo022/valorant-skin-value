-- Enable Row Level Security across all app tables and add policies that
-- mirror the access rules already enforced in the Next.js route handlers
-- (see src/lib/auth.ts and src/app/api/**). Prisma's schema.prisma has no
-- way to express RLS policies natively, so this is a hand-written SQL
-- migration applied directly against Supabase Postgres, not something
-- `prisma db push` can generate from the schema.
--
-- All of `users.id` / `*.user_id` / `review_flags.flagged_by` /
-- `review_tags.review_id` are stored as `text` (Prisma's default column
-- type for String fields), while Supabase's `auth.uid()` returns `uuid` —
-- every comparison below casts auth.uid() to text so the two sides match.
--
-- Apply with:
--   npx prisma db execute --file supabase/migrations/20260706000000_enable_rls_policies.sql --schema prisma/schema.prisma

-- =========================================================================
-- Public read-only reference data: weapons, skin_lines, skins,
-- content_tiers, chromas
-- =========================================================================
-- Seeded via prisma/seed.ts using the service role key, which bypasses RLS
-- entirely — so no INSERT/UPDATE/DELETE policy is needed for any role.
-- Policies with no `to` clause apply to every role (anon + authenticated).

alter table weapons enable row level security;
create policy "weapons_select_all" on weapons for select using (true);

alter table skin_lines enable row level security;
create policy "skin_lines_select_all" on skin_lines for select using (true);

alter table skins enable row level security;
create policy "skins_select_all" on skins for select using (true);

alter table content_tiers enable row level security;
create policy "content_tiers_select_all" on content_tiers for select using (true);

alter table chromas enable row level security;
create policy "chromas_select_all" on chromas for select using (true);

-- =========================================================================
-- users
-- =========================================================================
-- Profile rows are readable by any logged-in user (needed to show reviewer
-- display names on skin pages) but only editable by the row's own owner.

alter table users enable row level security;

create policy "users_select_authenticated" on users
  for select to authenticated
  using (true);

create policy "users_insert_self" on users
  for insert to authenticated
  with check (auth.uid()::text = id);

create policy "users_update_self" on users
  for update to authenticated
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

-- =========================================================================
-- user_owned_skins, active_loadout, wishlists
-- =========================================================================
-- Each row already models "belongs to exactly one user" — these three
-- tables get the same blanket "only your own rows, for every operation"
-- policy, matching how the API routes already scope every query by
-- getCurrentUser()'s id.

alter table user_owned_skins enable row level security;
create policy "user_owned_skins_own_rows" on user_owned_skins
  for all to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

alter table active_loadout enable row level security;
create policy "active_loadout_own_rows" on active_loadout
  for all to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

alter table wishlists enable row level security;
create policy "wishlists_own_rows" on wishlists
  for all to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- =========================================================================
-- reviews
-- =========================================================================
-- Reviews are the core public content of the site (aggregate scores, the
-- review list on a skin's page) — readable by everyone, writable only by
-- the reviewer who owns the row.

alter table reviews enable row level security;

create policy "reviews_select_all" on reviews
  for select
  using (true);

create policy "reviews_insert_own" on reviews
  for insert to authenticated
  with check (auth.uid()::text = user_id);

create policy "reviews_update_own" on reviews
  for update to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy "reviews_delete_own" on reviews
  for delete to authenticated
  using (auth.uid()::text = user_id);

-- =========================================================================
-- review_tags
-- =========================================================================
-- review_tags has no user_id column of its own (see SPEC.md section 5) —
-- ownership is derived through the parent review, so the write policies
-- use a subquery against `reviews` instead of a direct column check.

alter table review_tags enable row level security;

create policy "review_tags_select_all" on review_tags
  for select
  using (true);

create policy "review_tags_insert_own_review" on review_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from reviews
      where reviews.id = review_tags.review_id
        and reviews.user_id = auth.uid()::text
    )
  );

create policy "review_tags_delete_own_review" on review_tags
  for delete to authenticated
  using (
    exists (
      select 1 from reviews
      where reviews.id = review_tags.review_id
        and reviews.user_id = auth.uid()::text
    )
  );

-- =========================================================================
-- review_flags
-- =========================================================================
-- Flags are private to the person who filed them — nobody should be able
-- to see who flagged what, or edit/withdraw a flag once filed (moderation
-- is handled out-of-band, not by the flagger). No UPDATE/DELETE policy is
-- created, so those operations are denied outright for regular users.

alter table review_flags enable row level security;

create policy "review_flags_select_own" on review_flags
  for select to authenticated
  using (auth.uid()::text = flagged_by);

create policy "review_flags_insert_own" on review_flags
  for insert to authenticated
  with check (auth.uid()::text = flagged_by);
