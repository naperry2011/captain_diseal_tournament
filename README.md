# Captain Diesel's Dojo

A single-elimination tournament bracket tool for running live, screen-shared
showdowns of anime, shows, movies, and games. Build a bracket of 8–64 competitors,
share the bracket screen on stream, and advance winners with a click as the
matches play out.

- **Seeding** — search AniList (anime), TMDB (shows + movies), and IGDB (games) to
  add competitors with cover art, or add custom entries.
- **Bracket view** — a high-contrast, screen-share-friendly bracket. Click a
  competitor to advance them; a quick katana-slash flourish marks the winner.
- **Single source of truth** — every tournament lives in Postgres, so the bracket
  survives refreshes and can be reopened later.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** — brand tokens defined via `@theme` in `app/globals.css`
- **Prisma 7** with the `@prisma/adapter-pg` driver adapter
- **Postgres** (Neon / Vercel Postgres)
- **Zod** for validation, **Vitest** for tests

## Local setup

Requires Node 20+ and a Postgres database (Neon works well — it provides both a
pooled and a direct connection string).

```bash
# 1. Install dependencies (postinstall runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#   then fill in the values — see "Environment variables" below

# 3. Push the schema to your database
#   Uses DATABASE_URL_UNPOOLED (the direct connection) via prisma.config.ts;
#   pooled/pgbouncer URLs are unreliable for DDL.
npx prisma db push

# 4. Run the dev server
npm run dev
```

The app runs at http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env` and fill in real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | **Pooled** (`-pooler`) connection. Used by the running app at runtime via the Prisma pg adapter. This is the one you set in Vercel. |
| `DATABASE_URL_UNPOOLED` | recommended | **Direct** (non-pooler) connection. Used by the Prisma CLI for schema ops (`db push` / `migrate`). Falls back to `DATABASE_URL` if unset. |
| `TMDB_READ_TOKEN` | for shows + movies | TMDB v4 Read Access Token (bearer, preferred). |
| `TMDB_API_KEY` | for shows + movies | TMDB v3 API key (fallback). At least one TMDB value is needed or the Shows/Movies tabs show "search unavailable". |
| `TWITCH_CLIENT_ID` | for games | Twitch app client ID — IGDB auth uses a Twitch OAuth grant. |
| `TWITCH_CLIENT_SECRET` | for games | Twitch app client secret. Both are required or the game tab shows "coming soon". |

### Media APIs

- **AniList (anime)** — no API key required.
- **TMDB (shows + movies)** — needs `TMDB_READ_TOKEN` (or `TMDB_API_KEY`). Get one at
  https://www.themoviedb.org/settings/api.
- **IGDB (games)** — needs `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` from a
  Twitch developer app at https://dev.twitch.tv/console.

## Testing

```bash
npm test          # run the Vitest suite once
npm run test:watch
```

## Deployment (Vercel)

Vercel auto-detects Next.js — no `vercel.json` needed.

1. Import the repo into Vercel.
2. Set the environment variables above in the project settings. Use the **pooled**
   connection for `DATABASE_URL`.
3. Deploy. `npm install` runs the `postinstall` script (`prisma generate`) so the
   Prisma client is generated before `next build`.

Run `npx prisma db push` once against your production database (using the direct
connection) to create the schema before the first deploy.
