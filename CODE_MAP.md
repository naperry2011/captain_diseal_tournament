# CODE_MAP

> Captain Diesel's Dojo — single-client tournament bracket web app (Next.js 16 App Router, TS, Tailwind v4, Prisma/Postgres).
> Status: Phases 0–1 built. Items marked **[planned]** are defined in `docs/plans/2026-06-28-captain-diesels-dojo-tournament.md` but not yet implemented.

## App Shell & Branding

Category: UI / Infra

Primary Files:
* app/layout.tsx — root layout, fonts (Oswald/Inter via next/font), metadata, dark body, renders LogoHeader
* app/page.tsx — branded home placeholder (hero) **[full dashboard planned]**
* app/globals.css — Tailwind v4 `@theme` brand tokens (dojo palette, red-glow shadow, `.display` utility)
* components/LogoHeader.tsx — full-bleed banner header, link to "/"

Supporting Files:
* public/logo-banner.jpg — brand banner image
* app/favicon.ico
* postcss.config.mjs, eslint.config.mjs, next.config.ts, tsconfig.json

External Integrations: none

Entry Points: app/layout.tsx (wraps all routes)

## Bracket Engine

Category: Service (pure domain logic)

Primary Files:
* lib/bracket.ts — pure, framework-free single-elim engine: `nextPowerOfTwo`, `seedOrder`, `generateBracket` (byes + input validation), `advance` (immutable), `champion`; types `MediaType`, `SeedEntry`, `BracketMatch`, `Bracket`

Supporting Files:
* lib/bracket.test.ts — 24 Vitest cases (generation, snake seeding, byes, advance, champion, negative/validation)
* vitest.config.ts — node env, `**/*.test.{ts,tsx}`, tsconfig path alias

External Integrations: none (zero imports — reused by persistence layer)

Entry Points: imported by **[planned]** lib/tournaments.ts

## Persistence & Tournament CRUD **[planned]**

Category: Service / Infra

Primary Files:
* prisma/schema.prisma — Tournament, Participant, Match, MediaCache (enums: TournamentStatus, MediaType, MatchStatus)
* lib/db.ts — Prisma client singleton
* lib/tournaments.ts — create/list/get, addParticipants, randomizeSeeds, generateAndSaveBracket, advanceMatch (translates DB rows ↔ lib/bracket.ts)

External Integrations: PostgreSQL (via `DATABASE_URL`)

## Media Search **[planned]**

Category: API / Service

Primary Files:
* lib/media/types.ts — `MediaResult`, `MediaProvider` interface
* lib/media/anilist.ts — live AniList GraphQL provider + tested mapper
* lib/media/tmdb.ts — TMDB provider: searchTmdbShows (TV) + searchTmdbMovies
* lib/media/cache.ts — 24h MediaCache read/write
* app/api/search/[type]/route.ts — GET search proxy (anime live, others stub)

External Integrations: AniList GraphQL (no key); TMDB/IGDB stubbed for later

## Create Flow & Dashboard UI **[planned]**

Category: UI

Primary Files:
* app/page.tsx (dashboard upgrade) + components/TournamentList.tsx
* app/tournament/create/page.tsx + components/CreateWizard.tsx
* components/MediaSearch.tsx — per-competitor media picker (tabs)
* app/tournament/[id]/setup/page.tsx — seeding + "Generate Bracket & Go Live"

External Integrations: search API route, tournament server actions

## Bracket View (screen-shared) **[planned]**

Category: UI / Streaming

Primary Files:
* app/tournament/[id]/page.tsx — bracket display (server component)
* app/tournament/[id]/actions.ts — `advanceWinner` server action (revalidatePath)
* components/BracketTree.tsx, components/MatchCard.tsx, components/CompetitorCard.tsx

External Integrations: tournament persistence; no SSE/WebSockets (screen-share is the display)
