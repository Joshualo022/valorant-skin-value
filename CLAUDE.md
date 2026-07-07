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

## Current status (as of 2026-07-06)

The v1 feature set from SPEC.md is built end-to-end and **live in production** at https://www.myradianite.com (custom domain connected, SSL auto-issued by Vercel, apex redirects to `www` as canonical via `next.config.ts`). Deployed on Vercel with GitHub auto-deploy on push to `main`.

Built and deployed:
- Auth (Supabase), collection ownership, reviews (with tags, score aggregation), skin detail pages.
- **Skin Catalog**: single persistent page (`/catalog`, renamed from "Collection Builder"), weapon + content-tier filters synced to URL query params (AND-combined, more rows can be added later without restructuring), server-side cursor/keyset pagination with infinite scroll (`src/lib/catalog.ts`, `src/app/api/skins/catalog/route.ts`).
- **Wishlist**: separate from ownership (`Wishlist` Prisma model, `/api/me/wishlist`, `/wishlist` page, wishlist count + chroma swatches on skin detail).
- **Row Level Security**: enabled on all 12 Supabase tables with policies (`supabase/migrations/20260706000000_enable_rls_policies.sql`), verified via cross-user isolation tests. Note: this protects the public Supabase REST API surface — the Next.js app itself connects via a `BYPASSRLS` role and is still governed entirely by its own `userId` checks in route handlers.
- Favicon + header logo: a segmented-ring diamond mark (`src/app/icon.svg`, `src/app/layout.tsx`), reusing the tier ring-glow treatment from collection cards.

Known follow-ups, not yet done:
- **Supabase Auth Site URL** still needs a manual update in the Supabase dashboard (Authentication → URL Configuration) to include `https://www.myradianite.com` — until then, production email-confirmation links won't work correctly.
- **Naming**: decided to keep "Valorant Skin Value" as the page title/wordmark for now (self-explanatory to new visitors); `myradianite.com` is just the domain for now. Revisit a full rebrand to "Radianite" closer to launch if wanted.
- Remaining SPEC.md Week 4 items: seed real review/collection data, general polish, finalize README.
