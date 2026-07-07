@AGENTS.md

# Valorant Skin Value

Full spec: [context-for-claude/SPEC.md](context-for-claude/SPEC.md) — data model, v1 scope, API routes, tech stack, timeline. Read it before making architectural decisions. Check with the user before expanding scope beyond what it defines.

## About the user

CS student with a background in C/systems programming, linear algebra, and multivariable calculus. Understands programming fundamentals (data structures, functions, pointers, memory) well, but this is their first Next.js / full-stack web app — no prior exposure to React, JSX, routing conventions, server vs. client boundaries, or ORMs. This project is a learning project as much as a portfolio project.

## How to work with the user

- **Explain before or alongside doing, not after.** When introducing a concept not yet used in this project (a new library, a Next.js convention, a React pattern, a Prisma feature), give a short plain-language explanation of what it is and why it's needed *before or as* it's implemented — not just a summary afterward.
- **Lead with a short explanation, details on request.** 2-4 sentence plain-language summary first. Only go deeper (formal terminology, edge cases, alternative approaches) if asked.
- **Bridge from systems/C concepts when possible**, rather than a web-dev-specific analogy the user won't have context for.
- **Don't stack multiple new concepts in one explanation.** If a change touches several unfamiliar things at once (e.g., a new API route AND a new React pattern AND a Prisma relation), introduce them one at a time.
- **Say why, not just what.** State briefly why an implementation choice was made over alternatives — the user wants to be able to explain their own project's decisions in an interview, not just have working code they can't account for.
- **Flag what's boilerplate vs. what matters.** Routine scaffolding can just be done without much ceremony. Core logic — queries, aggregation, the collection-value calculation, the review/verification logic — is exactly the part the user wants to understand deeply.

## Tech stack (already decided)

- Next.js + TypeScript (App Router)
- Prisma ORM
- PostgreSQL via Supabase
- Supabase Auth + Storage
- Tailwind CSS
- Hosted on Vercel

## Timeline

Working toward a v1 launch in about a month. Prioritize getting things working end-to-end over polish — refine later.

## Current status (as of 2026-07-07)

The v1 feature set from SPEC.md is built end-to-end and **live in production** at https://www.myradianite.com (custom domain connected, SSL auto-issued by Vercel, apex redirects to `www` as canonical via `next.config.ts`). Deployed on Vercel with GitHub auto-deploy on push to `main`.

Built and deployed:
- Auth (Supabase), collection ownership, reviews (with tags, score aggregation), skin detail pages.
- **Skin Catalog**: single persistent page (`/catalog`, renamed from "Collection Builder"), weapon + content-tier filters synced to URL query params (AND-combined, more rows can be added later without restructuring), server-side cursor/keyset pagination with infinite scroll (`src/lib/catalog.ts`, `src/app/api/skins/catalog/route.ts`).
- **Wishlist**: separate from ownership (`Wishlist` Prisma model, `/api/me/wishlist`, `/wishlist` page, wishlist count + chroma swatches on skin detail).
- **Row Level Security**: enabled on all 12 Supabase tables with policies (`supabase/migrations/20260706000000_enable_rls_policies.sql`), verified via cross-user isolation tests. Note: this protects the public Supabase REST API surface — the Next.js app itself connects via a `BYPASSRLS` role and is still governed entirely by its own `userId` checks in route handlers.
- Favicon + header logo: a segmented-ring diamond mark (`src/app/icon.svg`, `src/app/layout.tsx`), reusing the tier ring-glow treatment from collection cards.
- **Collection Value / Loadout Valuation Toggle** (formerly "Face Value" / "Realistic Value", SPEC.md section 18, renamed 2026-07-07): `getOwnedSkinsWithValue` (`src/lib/collection.ts`) returns collection value (sum of resolved VP prices across all owned skins). A separate `getLoadoutValuation()` computes the realistic-value math — tier price scaled by other owners' average value score, excluding the viewer's own review (`getAvgValueScoresExcludingUser`, `src/lib/reviews.ts`) — but scoped to only the skins currently equipped in the active loadout, not the whole collection. Both share the `valuateSkins()` helper in `collection.ts`. Select-tier weapon skins (not melees) still count as 0, since many are earned free via the Battlepass. Toggle + disclaimer live on the Collection tab header, shared by both tabs.
- **Shareable "Flex" Collection View** (SPEC.md section 17): opt-in public link at `/collection/:slug` (`collectionShareSlug` on `User`, enable/disable via `POST`/`DELETE /api/me/share`), showing collection value, loadout valuation, collection size, a user-chosen **Flex Item** hero, and the real loadout grid (read-only) — plus a dynamic Open Graph share-card image via `next/og`'s `ImageResponse` (`src/app/collection/[slug]/opengraph-image.tsx`, still numbers-only, no skin renders). The spec's "rarest item" (auto-derived by highest VP price) was replaced 2026-07-07 with a manually-chosen **Flex Item**: `User.flexItemSkinId` (nullable FK to `Skin`, migration `20260707225856_add_user_flex_item_skin_id`), set via the thumbnail picker in the Share panel (`PUT`/`DELETE /api/me/flex-item`, restricted to owned skins). Renders as a large background hero on the share page, tinted with the skin's tier-rarity gradient (`getTierStyle`).
- **Active Loadout screen**: `/collection` is now tabbed — "Collection" (the original per-weapon owned-skin list, `src/app/collection/owned-skins-grid.tsx`) and "Active Loadout" (`/collection/loadout`, `src/app/collection/loadout/loadout-grid.tsx`), sharing one header/value-toggle/share-panel/progress-bar (`src/app/collection/collection-header.tsx`) so they read as one page, not two. The Loadout tab is a 4-column grid matching Valorant's own in-game collection screen layout (`LOADOUT_COLUMNS`/`LOADOUT_GROUP_LABELS` in `src/lib/weapon-order.ts`), with dimmed `killfeedIconUrl` placeholders for unequipped weapons and a click-to-open chroma-swatch popover backed by a new `Chroma.swatchUrl` column. Shared logic lives in `getLoadoutSlots()` (`src/lib/loadout.ts`), used by both `GET /api/me/loadout` and the page directly; `PUT /api/me/loadout/:weaponId` now also accepts an optional `chromaId`. This used to be a separate top-level `/loadout` page/nav item — merged into Collection as a tab since two disconnected pages for "skins I own" felt redundant; old `/loadout` links redirect (`next.config.ts`). As of 2026-07-07: unequipped slots are now links to `/collection#group-<weapontype>` (jumping straight to that weapon's picker on the Collection tab) instead of static boxes — disabled on the read-only public share page. The tab also now includes the full "All Owned Skins" grid below it (extracted into `src/app/collection/all-owned-skins-grid.tsx`, shared with the Collection tab), each card reading "Click to review →" to make the review flow discoverable from either tab.
- **Review nudges** (2026-07-07): the collection progress bar (`collection-header.tsx`) now has a "Review your skins →" button linking to `/collection#all-owned` whenever `reviewedCount < ownedCount`.

Known follow-ups, not yet done:
- **Naming**: decided to keep "Valorant Skin Value" as the page title/wordmark for now (self-explanatory to new visitors); `myradianite.com` is just the domain for now. Revisit a full rebrand to "Radianite" closer to launch if wanted.
- All SPEC.md feature sections (1-18) are now built, plus the Active Loadout view and Flex Item beyond spec. Remaining Week 4 items: seed real review/collection data, general polish.
- The Active Loadout tab's chroma popover only swaps chromas — equipping a *different skin* for a weapon still requires the Collection tab's per-weapon picker (though empty slots now at least deep-link there). Discussed extending the popover into a combined skin+chroma picker but not yet built.
- The OG share-card image now also shows the Flex Item art (tier-tinted, see below) — no longer purely numbers-only.

Done since the last update:
- **Supabase Auth Site URL** updated in the Supabase dashboard to include `https://www.myradianite.com` — production email-confirmation links now work correctly.
- **README** rewritten (`README.md`) with features, tech stack, data sourcing/pricing notes, and local dev setup.
- Built the Active Loadout screen, then restructured it from a standalone `/loadout` page into a `/collection` tab (see above) after user feedback that two separate "skins I own" pages felt disconnected.
- Renamed Face Value/Realistic Value to Collection Value/Loadout Valuation and rescoped the latter to the active loadout only; replaced the auto-derived "rarest item" with a user-picked Flex Item (new `User.flexItemSkinId` column, migration applied directly to the production Supabase DB); added review-discoverability nudges (progress-bar CTA, "Click to review" on All Owned cards, All Owned section now also on the Loadout tab); empty loadout slots deep-link to their weapon group on the Collection tab.
- Extended the OG share-card image (`src/app/collection/[slug]/opengraph-image.tsx`) to render the Flex Item's weapon art as a large right-side visual, tinted by its content-tier color (a hardcoded hex copy of `tier-style.ts`'s palette, since Satori/`next/og` doesn't read Tailwind classes) — by design, each person's card now looks visually distinct rather than sharing one fixed accent color. Also added a `myradianite.com` domain tag to both the normal and revoked-link fallback cards.
