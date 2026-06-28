# DATA_FLOW

> System-level data movement. Items marked **[planned]** are not yet implemented. No real-time transport (SSE/WebSockets) by design — the live display is a screen-shared page that re-renders on server action.

## Page Render (current)

Source: Browser request
Transport: HTTP (Next.js App Router)
Processor: app/layout.tsx → route page (server component)
Storage: none yet
Downstream Consumers: rendered HTML/CSS (brand theme)

## Bracket Computation (in-memory, current)

Source: Seeded participant list (`SeedEntry[]`)
Transport: function call
Processor: lib/bracket.ts (generateBracket → advance → champion)
Storage: none (pure values returned)
Downstream Consumers: **[planned]** lib/tournaments.ts persistence

## Tournament Creation **[planned]**

Source: Create wizard form
Transport: HTTP POST / server action
Processor: lib/tournaments.ts (createTournament, addParticipants)
Storage: Postgres (Tournament, Participant)
Downstream Consumers: setup page, bracket generation

## Bracket Generation & Go Live **[planned]**

Source: Setup page "Generate & Go Live"
Transport: server action
Processor: lib/tournaments.ts.generateAndSaveBracket → lib/bracket.ts.generateBracket
Storage: Postgres (Match rows; Tournament.status = live)
Downstream Consumers: bracket view page

## Winner Advancement **[planned]**

Source: Click on competitor in a ready match (bracket page)
Transport: server action (advanceWinner)
Processor: lib/tournaments.ts.advanceMatch → lib/bracket.ts.advance → revalidatePath
Storage: Postgres (Match.winnerId/status; next Match slot filled)
Downstream Consumers: re-rendered bracket page (what the streamer screen-shares)

## Media Search **[planned]**

Source: MediaSearch input (debounced query)
Transport: HTTP GET /api/search/[type]?q=
Processor: app/api/search/[type]/route.ts → lib/media provider (anilist live / stub)
Storage: Postgres MediaCache (24h TTL)
Downstream Consumers: create wizard (attaches mediaId/title/imageUrl to participant)
