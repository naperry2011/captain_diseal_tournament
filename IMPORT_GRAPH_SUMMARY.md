# IMPORT_GRAPH_SUMMARY

> High-level coupling overview. Items marked **[planned]** are not yet implemented.

## Core Dependency Nodes

* lib/bracket.ts — pure domain core; ZERO imports. Will be the most-depended-on module (persistence + server actions consume it). Stable foundation.
* app/layout.tsx — wraps every route; depends on app/globals.css + components/LogoHeader.tsx.
* app/globals.css — single source of brand tokens (Tailwind v4 `@theme`); every component consumes its utilities implicitly.
* lib/db.ts **[planned]** — Prisma client singleton; imported by all persistence + API code.
* lib/tournaments.ts **[planned]** — bridge between DB rows and lib/bracket.ts; central to create/setup/bracket flows.

## Utility Modules Reused Broadly

* lib/bracket.ts types (SeedEntry, BracketMatch, Bracket) — shared across persistence + UI.
* lib/media/types.ts **[planned]** — MediaProvider/MediaResult shared by providers, API route, and MediaSearch UI.

## Potential Refactor Risk Areas

* lib/tournaments.ts **[planned]** — will be a hub coupling Prisma models to the pure engine; keep DB↔Bracket translation isolated here to avoid leaking Prisma types into lib/bracket.ts.
* app/globals.css token names — renaming dojo-* tokens breaks utilities across all components; treat as a stable API.
* Tailwind v4 (CSS-config) — no tailwind.config.ts; contributors expecting JS config may misconfigure. Tokens live in globals.css only.

## Circular Dependencies

* None present. lib/bracket.ts importing nothing prevents cycles at the core. Maintain one-way flow: UI → tournaments → {db, bracket}; providers → {types, db, cache}.
