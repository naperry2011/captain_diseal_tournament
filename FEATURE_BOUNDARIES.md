# FEATURE_BOUNDARIES

> Responsibility boundaries between systems. Items marked **[planned]** are not yet implemented.

## Bracket Engine (lib/bracket.ts)

Owns: Single-elim math — bracket generation, snake seeding, bye handling, winner advancement, champion detection, input validation, and the core domain types.
Does NOT Own: Persistence, IDs generation, HTTP, rendering, media data.
Communicates With: Called by lib/tournaments.ts **[planned]** with plain values.
Isolation Level: Strong (zero imports; pure functions).

## Persistence / Tournament Service (lib/db.ts, lib/tournaments.ts) **[planned]**

Owns: Reading/writing Tournament, Participant, Match in Postgres; translating DB rows ↔ Bracket; orchestrating create/seed/generate/advance.
Does NOT Own: Bracket math (delegates to lib/bracket.ts), media fetching, UI.
Communicates With: lib/bracket.ts, Prisma/Postgres, server actions, pages.
Isolation Level: Moderate (couples Prisma models to domain; the only place that should).

## Media Search (lib/media/*, app/api/search/[type]) **[planned]**

Owns: Provider interface, AniList live querying + mapping, stub providers, 24h caching, search HTTP endpoint.
Does NOT Own: Bracket logic, tournament persistence (writes only to MediaCache), participant records.
Communicates With: AniList GraphQL, MediaCache (Postgres), MediaSearch UI.
Isolation Level: Strong (swappable providers behind MediaProvider; TMDB/IGDB drop in later).

## App Shell & Branding (app/layout.tsx, app/globals.css, components/LogoHeader.tsx)

Owns: Global theme, fonts, brand tokens, header/logo, page chrome.
Does NOT Own: Any feature logic or data.
Communicates With: All routes (visual only).
Isolation Level: Strong (presentation layer).

## Create / Setup UI (app/tournament/create, app/tournament/[id]/setup, CreateWizard, MediaSearch, TournamentList) **[planned]**

Owns: Tournament setup interaction — size choice, competitor entry (manual/bulk), media selection, seeding, go-live trigger.
Does NOT Own: Bracket math, DB writes (delegates to server actions/lib/tournaments.ts), media fetching (calls search API).
Communicates With: search API, tournament server actions.
Isolation Level: Moderate (UI orchestration over services).

## Bracket View (app/tournament/[id], actions.ts, BracketTree, MatchCard, CompetitorCard) **[planned]**

Owns: Rendering the live bracket and the click-to-advance interaction the streamer screen-shares.
Does NOT Own: Bracket math or persistence (advance action delegates to lib/tournaments.ts → lib/bracket.ts).
Communicates With: tournament persistence via advanceWinner server action.
Isolation Level: Moderate (display + thin action layer; no client-side state sync).
