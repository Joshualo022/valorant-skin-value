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
