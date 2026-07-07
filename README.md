# Valorant Skin Value

**Live at [myradianite.com](https://www.myradianite.com)**

A skin review platform for VALORANT where only verified owners can rate quality and value — separating real ownership experience from community hype — plus a tool to calculate and share your collection's total worth.

## Why

Built after spending $100 on skins by budget rather than by picking the best skins for the best guns, then researching "best skin" rankings online and noticing those rankings reflect general hype/consensus rather than owned experience. Anyone can post an opinion on a skin they've never bought; this site restricts quality/value reviews to people who actually own the skin, so the aggregate scores mean something.

## Features

- **Verified-owner reviews** — quality score, value score, would-rebuy, optional tags (design/feel/sound/VFX/community-take), and free text. One review per skin you own; aggregate scores are computed live from real reviews, not editorialized.
- **Skin Catalog** — the main browsable grid of every skin, with weapon and content-tier filters synced to the URL, server-side keyset pagination, and infinite scroll.
- **Collection builder** — mark skins you own, set one active "equipped" skin per weapon (a mock loadout), and see your collection's total value.
- **Two collection values, side by side**:
  - **Face value** — sum of each skin's VP price at its content tier.
  - **Realistic value** — face value scaled by what other owners actually rate each skin's value (excluding your own review, so you can't inflate your own number). Select-tier weapon skins count as 0, since many are earned free via the Battlepass rather than bought — their tier price isn't a trustworthy real-money estimate.
- **Wishlist** — separate from ownership; wishlist a skin you're considering, see how many others want it and the total VP cost of your list, with no quality/value score attached (wishlisting signals desire, not a judgment reserved for owners).
- **Shareable "flex" view** — opt in to generate an unlisted `/collection/:slug` link showing off your loadout, both value numbers, collection size, and a rarest-item callout, with a dynamic Open Graph image for rich link previews.
- **Auth** via Supabase, with Row Level Security enabled on every table as a second layer of protection behind the app's own per-request ownership checks.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend/Backend | Next.js (App Router) + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Data sourcing & pricing

- **Seed source**: [valorant-api.com](https://valorant-api.com) (unofficial, free, no auth) — weapons, skins, skin lines, chromas, and images. The seed script (`prisma/seed.ts`) is re-runnable, so it can pick up newly released skins each in-game Act without duplicating existing rows.
- **Pricing**: VP prices are static and hand-maintained per content tier (`prisma/seed-data/content-tier-prices.ts`), since Riot's API doesn't expose real-money pricing. Melee weapons are priced independently via a per-skin override (`Skin.vpPriceOverride`), since a melee skin in a line costs roughly 2x its gun-skin siblings' tier price.
- **Known limitation**: face value treats every owned skin as if bought at full tier price, regardless of how it was actually acquired (store, Battlepass, etc.) — it's an estimate of value-at-content-tier, not a precise spend tracker. No Riot account credentials, session tokens, or inventory data are ever requested or stored.

## Local development

```bash
npm install
cp .env.example .env   # fill in your own Supabase project's values
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

`.env` needs a Supabase project's Postgres connection strings and API keys — see `.env.example` for the exact variables. `DIRECT_URL` is used by the Prisma CLI for migrations; the running app uses the pooled `DATABASE_URL` at runtime.

## Disclaimer

Valorant Skin Value isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing VALORANT. VALORANT and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
