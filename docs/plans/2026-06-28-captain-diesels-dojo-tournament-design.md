# Captain Diesel's Dojo — Tournament Bracket Platform: Design

**Date:** 2026-06-28
**Status:** Approved — ready for implementation planning

## Summary

A single-client tournament bracket web app for streaming nerd-culture competitions
(anime / cartoons / video games), branded to the **Captain Diesel's Dojo** identity.
The streamer runs single-elimination brackets of 8–64 competitors, attaches cover art
from media APIs, and screen-shares a clean bracket page on a second monitor while
clicking competitors to advance them live.

## Key decisions (from brainstorming)

- **Deliverable:** full build per the spec, branded to the logo.
- **Database:** Postgres (Neon / Vercel) + Prisma.
- **Media APIs:** AniList live (no key); TMDB (cartoons) and IGDB (games) stubbed
  behind a swappable `MediaProvider` interface until credentials are available.
- **Auth:** none. The streamer screen-shares a monitor, so every view is public.
- **Live updates:** none needed. The shared screen IS the display; clicking a
  competitor advances them and the page re-renders. No SSE/WebSockets.

## Section 1 — Brand & Visual Identity

Derived from the logo (Captain Diesel's Dojo — Comics, Gaming, Movies, Anime):

- **Palette:** near-black backgrounds (`#0d0d0f`), blood/diesel red accent
  (`#c8102e`–`#e11d2a`), bright white display text, warm dark-grey concrete/rain tones.
  Red edge-glow on active/winning elements (echoes the katana streak).
- **Type:** heavy condensed/uppercase display face for headings & competitor names;
  clean sans for body/UI.
- **Mood:** gritty anime-comic noir — dark cards, subtle texture, katana-slash motif
  used as divider and advance animation.
- **Logo usage:** banner in the site header; square "katana-C" mark for favicon/compact.

## Section 2 — Architecture & Data

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind, Prisma + Postgres,
deployed to Vercel.

**Prisma data model:**

- `Tournament` — id, name, status (`setup` | `live` | `done`), size (8/16/32/64), timestamps
- `Participant` — id, tournamentId, name, seed, mediaType (`anime`|`cartoon`|`game`),
  mediaId, imageUrl, title
- `Match` — id, tournamentId, round, position, p1Id, p2Id, winnerId,
  status (`pending`|`ready`|`done`)
- `MediaCache` — provider, mediaId, json, expiresAt (24h cache; respects AniList ~90 req/min)

**Bracket engine** (`lib/bracket.ts`, pure & unit-tested):
- generate single-elim bracket from N participants
- seed + auto-assign byes for non-power-of-two counts
- `advance(match, winnerId)` places the winner into the correct next match

**Click-to-advance flow:** clicking a competitor in a live match → server action sets
`winnerId`, advances them, revalidates the page. Screen-share sees a normal re-render.

## Section 3 — Screens & Components

1. **Home / Dashboard** (`/`) — branded landing, list of tournaments with status chips,
   big red "Create Tournament" CTA.
2. **Create flow** (`/tournament/create`) — pick size; add competitors with media search
   (AniList live; cartoon/game tabs show stub "coming soon"); manual name entry; bulk
   paste (one per line); seed via manual drag or "Randomize."
3. **Bracket view** (`/tournament/[id]`) — the screen-shared star. Full single-elim tree,
   competitor cards with cover art + name, click to advance (katana-slash highlight, red
   winner glow), subtle controls.
4. **Setup/edit view** — fix seeding/competitors before going live.

**Components:** `BracketTree`, `MatchCard`, `CompetitorCard`, `MediaSearch`,
`CreateWizard`, `TournamentList`, `LogoHeader`. Hand-built Tailwind components (no generic
UI kit) to fit the gritty brand.

## Section 4 — Error Handling & Testing

**Error handling:**
- AniList failure → "search unavailable, enter name manually" fallback; never blocks
  competitor creation. Cache absorbs repeat calls.
- Stubbed TMDB/IGDB return a clear "coming soon" state, not errors.
- Integrity guards: no advancing a decided match; can't go live with empty slots (byes
  excepted); can't delete competitors once live.

**Testing:**
- `lib/bracket.ts` built test-first (Vitest): generation for 8/16/32/64, bye placement
  for odd counts (e.g. 12, 24), full advance-to-champion runs.
- Lighter coverage elsewhere; UI validated by running it.

## Build order

1. Scaffold Next.js + Tailwind + Prisma; brand tokens & `LogoHeader`
2. Bracket engine (test-first)
3. DB schema + tournament CRUD
4. Create flow + AniList search (stubs for the other two)
5. Bracket view with click-to-advance
6. Polish to the dojo aesthetic + deploy config
