# ENTRY_POINTS

> Next.js App Router app. Execution entry points are the root layout, route pages/segments, server actions, and API routes. Items marked **[planned]** are not yet implemented.

## Root Layout

Path: app/layout.tsx
Responsibility: Global HTML shell — load fonts, apply dark brand theme, set metadata, render LogoHeader above all route content.
Invokes: components/LogoHeader.tsx
Depends On: app/globals.css, next/font/google

## Home Page

Path: app/page.tsx
Responsibility: Branded landing. Currently a static hero placeholder; **[planned]** becomes the dashboard listing tournaments with a "Create Tournament" CTA.
Invokes: **[planned]** components/TournamentList.tsx, lib/tournaments.ts (listTournaments)
Depends On: app/layout.tsx

## Create Tournament Page **[planned]**

Path: app/tournament/create/page.tsx
Responsibility: Wizard to choose size and add competitors (manual/bulk + media search).
Invokes: components/CreateWizard.tsx, components/MediaSearch.tsx, tournament server actions
Depends On: lib/tournaments.ts, /api/search/[type]

## Tournament Setup Page **[planned]**

Path: app/tournament/[id]/setup/page.tsx
Responsibility: Adjust seeds, then generate the bracket and go live.
Invokes: lib/tournaments.ts (randomizeSeeds, generateAndSaveBracket)
Depends On: lib/db.ts, lib/bracket.ts

## Tournament Bracket Page **[planned]**

Path: app/tournament/[id]/page.tsx
Responsibility: The screen-shared bracket display; click a competitor to advance.
Invokes: components/BracketTree.tsx, app/tournament/[id]/actions.ts
Depends On: lib/tournaments.ts (getTournament)

## Advance Winner Server Action **[planned]**

Path: app/tournament/[id]/actions.ts
Responsibility: Set match winner, advance into next round, revalidate the bracket page.
Invokes: lib/tournaments.ts (advanceMatch), next/cache revalidatePath
Depends On: lib/db.ts, lib/bracket.ts

## Media Search API Route **[planned]**

Path: app/api/search/[type]/route.ts
Responsibility: GET `?q=` proxy → AniList live or stub providers; never 500 on provider failure.
Invokes: lib/media/anilist.ts, lib/media/stub.ts, lib/media/cache.ts
Depends On: AniList GraphQL, lib/db.ts (MediaCache)

## Test Runner

Path: vitest.config.ts
Responsibility: Run unit tests (currently lib/bracket.test.ts) in node env.
Invokes: npm scripts `test` / `test:watch`
Depends On: vite-tsconfig-paths
