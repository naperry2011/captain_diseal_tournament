# Captain Diesel's Dojo Tournament Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-client, single-elimination tournament bracket web app, branded to the Captain Diesel's Dojo identity, that a streamer screen-shares to run anime/cartoon/game competitions of 8–64 competitors.

**Architecture:** Next.js 14 (App Router) + TypeScript + Tailwind, Prisma + Postgres. No auth — every view is public because the streamer screen-shares a monitor. The bracket page is both control and display: clicking a competitor advances them via a server action and the page re-renders. AniList media search is live; TMDB/IGDB are stubbed behind a shared `MediaProvider` interface. The bracket engine is pure, framework-free, and built test-first.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Vitest, Zod, deployed to Vercel.

---

## Conventions used in this plan

- Package manager: `npm`. Shell: PowerShell on Windows (commands shown are cross-shell where possible).
- Run a single test file: `npx vitest run path/to/file.test.ts`
- Commit after every green step. Commit messages use Conventional Commits (`feat:`, `test:`, `chore:`).
- For DB work during development you need a Postgres URL in `.env` as `DATABASE_URL`. Use a free Neon database, or local Postgres. SQLite is NOT used (we committed to Postgres).

---

## Phase 0 — Scaffold & Brand Foundation

### Task 0.1: Initialize the Next.js project

**Files:**
- Create: project files via scaffolder in repo root.

**Step 1: Scaffold in place**

The repo already exists with `docs/`, the spec, and the logo. Scaffold Next.js into the current directory.

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack
```
When prompted that the directory is not empty, allow it to proceed (it keeps existing files). If it refuses, scaffold into a temp dir and copy contents in.

Expected: `app/`, `package.json`, `tailwind.config.ts`, `tsconfig.json` created.

**Step 2: Verify it runs**

Run: `npm run dev` then open http://localhost:3000
Expected: default Next.js page loads. Stop the server (Ctrl+C).

**Step 3: Move the logo into public/**

Run:
```bash
cp captain_diesel_dojo_logo.jpg public/logo-banner.jpg
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 0.2: Install dependencies

**Step 1: Install runtime + dev deps**

Run:
```bash
npm install @prisma/client zod
npm install -D prisma vitest @vitejs/plugin-react vite-tsconfig-paths
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add prisma, zod, and vitest dependencies"
```

---

### Task 0.3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`

**Step 1: Write the config**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

**Step 2: Add test script to package.json**

Add to `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Step 3: Sanity test**

Create `lib/sanity.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
describe("sanity", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```

Run: `npm test`
Expected: 1 passing test.

**Step 4: Delete the sanity test and commit config**

```bash
rm lib/sanity.test.ts
git add vitest.config.ts package.json
git commit -m "chore: configure vitest"
```

---

### Task 0.4: Brand tokens & global theme

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Step 1: Add brand colors to Tailwind**

In `tailwind.config.ts`, extend `theme.extend.colors`:
```typescript
colors: {
  dojo: {
    black: "#0d0d0f",
    coal: "#16161a",
    steel: "#23232a",
    ash: "#8a8a93",
    red: "#e11d2a",
    blood: "#c8102e",
    white: "#f5f5f7",
  },
},
boxShadow: {
  "red-glow": "0 0 12px 0 rgba(225,29,42,0.55)",
},
```

**Step 2: Global theme in globals.css**

Replace body styling so the default background is `dojo.black` with `dojo.white` text. Add a `.display` utility class using an uppercase condensed font stack (`font-family: "Oswald", "Arial Narrow", system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.02em;`). Import Oswald + Inter via `next/font` in layout (preferred) instead of CSS import.

**Step 3: Fonts + metadata in layout.tsx**

Use `next/font/google` to load `Oswald` (display) and `Inter` (body), expose as CSS variables, set `<body className="bg-dojo-black text-dojo-white">`, and set metadata title `Captain Diesel's Dojo` / description.

**Step 4: Verify**

Run `npm run dev`, confirm dark background renders.

**Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat: add Captain Diesel's Dojo brand theme and fonts"
```

---

### Task 0.5: LogoHeader component

**Files:**
- Create: `components/LogoHeader.tsx`

**Step 1: Build it**

A server component rendering the banner (`/logo-banner.jpg`) via `next/image`, full-width, capped height (~180px), with the dark background bleeding into the page. Below it, a thin red rule (`border-b border-dojo-red`). Wrap the banner in a `<Link href="/">`.

**Step 2: Use it in layout**

Render `<LogoHeader />` at the top of `app/layout.tsx`'s body, above `{children}`.

**Step 3: Verify & commit**

Confirm banner shows on every page.
```bash
git add components/LogoHeader.tsx app/layout.tsx
git commit -m "feat: add branded LogoHeader"
```

---

## Phase 1 — Bracket Engine (test-first)

> REQUIRED SUB-SKILL: superpowers:test-driven-development for this whole phase. Write the test, watch it fail, implement minimally, watch it pass, commit.

This is the highest-risk logic. It is pure TypeScript with no DB or React. All types live in `lib/bracket.ts`.

### Domain types (reference — created as needed by the tasks below)

```typescript
export type MediaType = "anime" | "cartoon" | "game";

export interface SeedEntry {
  id: string;          // participant id
  name: string;
  seed: number;        // 1-based seed
}

export interface BracketMatch {
  round: number;       // 1 = first round, increases toward final
  position: number;    // 0-based slot within the round
  p1Id: string | null; // null = empty/bye slot
  p2Id: string | null;
  winnerId: string | null;
}

export interface Bracket {
  size: number;        // bracket size: 8/16/32/64 (next pow2 >= participants)
  matches: BracketMatch[];
}
```

### Task 1.1: Next power of two

**Files:**
- Create: `lib/bracket.ts`
- Test: `lib/bracket.test.ts`

**Step 1: Failing test**

```typescript
import { describe, it, expect } from "vitest";
import { nextPowerOfTwo } from "./bracket";

describe("nextPowerOfTwo", () => {
  it("returns 8 for 5..8", () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
  });
  it("returns 16 for 9..16", () => {
    expect(nextPowerOfTwo(12)).toBe(16);
  });
  it("returns 64 for 33..64", () => {
    expect(nextPowerOfTwo(64)).toBe(64);
  });
});
```

**Step 2: Run, expect fail** — `npx vitest run lib/bracket.test.ts` → FAIL (not defined).

**Step 3: Implement**

```typescript
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
```

**Step 4: Run, expect pass.**

**Step 5: Commit** — `test: nextPowerOfTwo + impl`.

---

### Task 1.2: Standard seeding order

The classic single-elim seeding that keeps top seeds apart (1 vs lowest, etc.). Produces the seed sequence for a bracket of given size.

**Step 1: Failing test**

```typescript
import { seedOrder } from "./bracket";

describe("seedOrder", () => {
  it("orders a size-4 bracket as [1,4,3,2]", () => {
    expect(seedOrder(4)).toEqual([1, 4, 3, 2]);
  });
  it("orders a size-8 bracket as [1,8,5,4,3,6,7,2]", () => {
    expect(seedOrder(8)).toEqual([1, 8, 5, 4, 3, 6, 7, 2]);
  });
  it("produces `size` entries that are a permutation of 1..size", () => {
    const o = seedOrder(16);
    expect(o).toHaveLength(16);
    expect([...o].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
  });
});
```

**Step 2: Run, expect fail.**

**Step 3: Implement** (recursive standard seeding)

```typescript
export function seedOrder(size: number): number[] {
  let rounds = [1, 2];
  while (rounds.length < size) {
    const n = rounds.length * 2;
    const next: number[] = [];
    for (const s of rounds) {
      next.push(s);
      next.push(n + 1 - s);
    }
    rounds = next;
  }
  return rounds;
}
```

**Step 4: Run, expect pass. Step 5: Commit.**

---

### Task 1.3: Generate first round with byes

Given seeded participants (already ordered by seed 1..N) and a bracket size, build round 1. Top seeds get byes when participants < size: a slot whose opponent is `null` is a bye, and that participant auto-advances.

**Step 1: Failing test**

```typescript
import { generateBracket } from "./bracket";

const mk = (n: number): SeedEntry[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}`, seed: i + 1 }));

describe("generateBracket", () => {
  it("size is next power of two of participant count", () => {
    expect(generateBracket(mk(12)).size).toBe(16);
    expect(generateBracket(mk(8)).size).toBe(8);
  });

  it("round 1 has size/2 matches", () => {
    const b = generateBracket(mk(8));
    const r1 = b.matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);
  });

  it("pairs seed 1 against seed 8 in an 8-player bracket", () => {
    const b = generateBracket(mk(8));
    const first = b.matches.find((m) => m.round === 1 && m.position === 0)!;
    expect(new Set([first.p1Id, first.p2Id])).toEqual(new Set(["p1", "p8"]));
  });

  it("gives top seeds byes when not full (5 players in size 8)", () => {
    const b = generateBracket(mk(5));
    // seed 1 (p1) should face a bye -> opponent null
    const seed1Match = b.matches.find(
      (m) => m.round === 1 && (m.p1Id === "p1" || m.p2Id === "p1"),
    )!;
    const opp = seed1Match.p1Id === "p1" ? seed1Match.p2Id : seed1Match.p1Id;
    expect(opp).toBeNull();
    expect(seed1Match.winnerId).toBe("p1"); // bye auto-advances
  });

  it("creates the full match tree (size-1 matches total)", () => {
    const b = generateBracket(mk(8));
    expect(b.matches).toHaveLength(7); // 4 + 2 + 1
  });
});
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

```typescript
export function generateBracket(participants: SeedEntry[]): Bracket {
  const size = nextPowerOfTwo(Math.max(participants.length, 2));
  const order = seedOrder(size); // seeds in slot order
  const bySeed = new Map(participants.map((p) => [p.seed, p]));

  // slot i holds the participant with seed order[i], or null if that seed doesn't exist
  const slots: (string | null)[] = order.map((seed) => bySeed.get(seed)?.id ?? null);

  const matches: BracketMatch[] = [];

  // Round 1
  for (let i = 0; i < size / 2; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    const winnerId = p2 === null && p1 !== null ? p1 : p1 === null && p2 !== null ? p2 : null;
    matches.push({ round: 1, position: i, p1Id: p1, p2Id: p2, winnerId });
  }

  // Empty later rounds
  let round = 2;
  let count = size / 4;
  while (count >= 1) {
    for (let i = 0; i < count; i++) {
      matches.push({ round, position: i, p1Id: null, p2Id: null, winnerId: null });
    }
    count = Math.floor(count / 2);
    round++;
  }

  // Propagate round-1 byes forward
  for (const m of matches.filter((x) => x.round === 1 && x.winnerId)) {
    placeWinnerIntoNext(matches, m.round, m.position, m.winnerId!);
  }

  return { size, matches };
}
```

Note: `placeWinnerIntoNext` is implemented in Task 1.4; write a tiny local stub first if needed to compile, then replace. Prefer doing Task 1.4 before running 1.3's bye test if ordering bites you — but keep them as separate commits.

**Step 4: Run, expect pass. Step 5: Commit.**

---

### Task 1.4: Advance a winner

**Step 1: Failing test**

```typescript
import { advance } from "./bracket";

describe("advance", () => {
  it("moves the winner into the correct next-round slot", () => {
    const b = generateBracket(mk(8));
    // win match (round 1, pos 0): p1 beats p8
    const b2 = advance(b, 1, 0, "p1");
    const r2 = b2.matches.find((m) => m.round === 2 && m.position === 0)!;
    expect(r2.p1Id).toBe("p1"); // pos 0 winner -> next pos 0, slot 1
  });

  it("winner of round1 pos1 lands in round2 pos0 slot2", () => {
    const b = generateBracket(mk(8));
    const b2 = advance(b, 1, 1, "p4"); // pos1 -> next pos 0, p2 slot
    const r2 = b2.matches.find((m) => m.round === 2 && m.position === 0)!;
    expect(r2.p2Id).toBe("p4");
  });

  it("throws when advancing an already-decided match", () => {
    const b = generateBracket(mk(8));
    const b2 = advance(b, 1, 0, "p1");
    expect(() => advance(b2, 1, 0, "p8")).toThrow();
  });

  it("throws when winnerId is not a participant of that match", () => {
    const b = generateBracket(mk(8));
    expect(() => advance(b, 1, 0, "p4")).toThrow();
  });
});
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

```typescript
function placeWinnerIntoNext(
  matches: BracketMatch[],
  round: number,
  position: number,
  winnerId: string,
): void {
  const nextRound = round + 1;
  const nextPos = Math.floor(position / 2);
  const next = matches.find((m) => m.round === nextRound && m.position === nextPos);
  if (!next) return; // was the final
  if (position % 2 === 0) next.p1Id = winnerId;
  else next.p2Id = winnerId;
  // auto-resolve a bye that may now be complete is NOT done here (only final placement)
}

export function advance(
  bracket: Bracket,
  round: number,
  position: number,
  winnerId: string,
): Bracket {
  const matches = bracket.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.round === round && m.position === position);
  if (!match) throw new Error(`No match at round ${round} position ${position}`);
  if (match.winnerId) throw new Error("Match already decided");
  if (winnerId !== match.p1Id && winnerId !== match.p2Id)
    throw new Error("Winner is not in this match");
  match.winnerId = winnerId;
  placeWinnerIntoNext(matches, round, position, winnerId);
  return { ...bracket, matches };
}
```

**Step 4: Run, expect pass. Step 5: Commit.**

---

### Task 1.5: Champion + full playthrough integration test

**Step 1: Test**

```typescript
import { champion } from "./bracket";

describe("champion + full run", () => {
  it("is null until the final is decided", () => {
    const b = generateBracket(mk(8));
    expect(champion(b)).toBeNull();
  });

  it("plays a full 8-bracket to a single champion", () => {
    let b = generateBracket(mk(8));
    // always advance the lower-numbered (lower id) participant present
    while (champion(b) === null) {
      const ready = b.matches.find(
        (m) => !m.winnerId && m.p1Id && m.p2Id,
      );
      if (!ready) throw new Error("no ready match but no champion");
      const pick = ready.p1Id!;
      b = advance(b, ready.round, ready.position, pick);
    }
    expect(champion(b)).toBe("p1");
  });

  it("handles 12 (non-power-of-two) to a champion", () => {
    let b = generateBracket(mk(12));
    while (champion(b) === null) {
      const ready = b.matches.find((m) => !m.winnerId && m.p1Id && m.p2Id)!;
      b = advance(b, ready.round, ready.position, ready.p1Id!);
    }
    expect(champion(b)).not.toBeNull();
  });
});
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

```typescript
export function champion(bracket: Bracket): string | null {
  const finalRound = Math.max(...bracket.matches.map((m) => m.round));
  const final = bracket.matches.find((m) => m.round === finalRound && m.position === 0);
  return final?.winnerId ?? null;
}
```

**Step 4: Run all bracket tests** — `npx vitest run lib/bracket.test.ts` → all PASS.

**Step 5: Commit** — `test: champion and full-playthrough integration`.

---

## Phase 2 — Database & Tournament CRUD

### Task 2.1: Prisma schema

**Files:**
- Create: `prisma/schema.prisma`
- Create/modify: `.env` (add `DATABASE_URL`), `.gitignore` (ensure `.env` ignored)

**Step 1: Init prisma**

Run: `npx prisma init --datasource-provider postgresql`

**Step 2: Write schema**

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TournamentStatus { setup live done }
enum MediaType { anime cartoon game }
enum MatchStatus { pending ready done }

model Tournament {
  id        String           @id @default(cuid())
  name      String
  status    TournamentStatus @default(setup)
  size      Int
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  participants Participant[]
  matches      Match[]
}

model Participant {
  id           String     @id @default(cuid())
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  tournamentId String
  name         String
  seed         Int
  mediaType    MediaType?
  mediaId      String?
  title        String?
  imageUrl     String?
}

model Match {
  id           String      @id @default(cuid())
  tournament   Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  tournamentId String
  round        Int
  position     Int
  p1Id         String?
  p2Id         String?
  winnerId     String?
  status       MatchStatus @default(pending)
  @@unique([tournamentId, round, position])
}

model MediaCache {
  id        String   @id @default(cuid())
  provider  String
  mediaId   String
  json      Json
  expiresAt DateTime
  @@unique([provider, mediaId])
}
```

**Step 3: Push schema**

Ensure `DATABASE_URL` points to a real Postgres (Neon). Run: `npx prisma db push`
Expected: tables created.

**Step 4: Commit** (do NOT commit `.env`)

```bash
git add prisma/schema.prisma .gitignore
git commit -m "feat: add prisma schema for tournaments, participants, matches"
```

---

### Task 2.2: Prisma client singleton

**Files:**
- Create: `lib/db.ts`

**Step 1: Implement** the standard Next.js dev-safe singleton:

```typescript
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

**Step 2: Commit** — `feat: add prisma client singleton`.

---

### Task 2.3: Tournament + bracket persistence helpers

**Files:**
- Create: `lib/tournaments.ts`

Functions (server-only): `createTournament(name, size)`, `listTournaments()`, `getTournament(id)` (with participants + matches), `addParticipants(id, entries)`, `randomizeSeeds(id)`, `generateAndSaveBracket(id)` (calls `generateBracket` from `lib/bracket.ts`, persists `Match` rows, sets status `live`), and `advanceMatch(tournamentId, round, position, winnerId)` (loads matches, reuses `advance()` logic conceptually but operates on DB rows: validate, set winner + status `done`, write winner into next match slot).

**Step 1:** Implement these reusing `lib/bracket.ts` pure functions where possible (e.g. build a `Bracket` from DB rows, call `advance`, diff and persist). Keep all bracket math in `lib/bracket.ts` — these helpers only translate to/from the DB.

**Step 2:** Add a focused test `lib/tournaments.test.ts` only for the pure translation helpers (e.g. `rowsToBracket` / `bracketToRows`) if you extract them; skip DB round-trip tests (no test DB in scope).

**Step 3: Commit** — `feat: tournament persistence and bracket save/advance`.

---

## Phase 3 — Media Search (AniList live, others stubbed)

### Task 3.1: MediaProvider interface + types

**Files:**
- Create: `lib/media/types.ts`

```typescript
export interface MediaResult {
  mediaId: string;
  title: string;
  imageUrl: string | null;
  mediaType: "anime" | "cartoon" | "game";
}
export interface MediaProvider {
  type: "anime" | "cartoon" | "game";
  available: boolean;
  search(query: string): Promise<MediaResult[]>;
}
```

**Commit** — `feat: media provider interface`.

### Task 3.2: AniList provider (live) — test the query builder

**Files:**
- Create: `lib/media/anilist.ts`
- Test: `lib/media/anilist.test.ts`

**Step 1:** Test the pure GraphQL query/variables builder and the response→`MediaResult[]` mapper (feed a sample AniList JSON payload, assert mapping). Do not hit the network in tests.

**Step 2:** Implement `searchAnilist(query)` that POSTs to `https://graphql.anilist.co` with the Media search query (fields: `id`, `title { romaji english }`, `coverImage { large }`), maps to `MediaResult`, and wraps results through the cache (Task 3.4). On HTTP error, throw a typed error the API route turns into a graceful response.

**Step 3:** Commit — `feat: AniList media provider with tested mapper`.

### Task 3.3: Stub providers for cartoon + game

**Files:**
- Create: `lib/media/stub.ts`

Returns `available: false` and an empty array (UI shows "coming soon"). Commit.

### Task 3.4: Media cache layer

**Files:**
- Create: `lib/media/cache.ts`

`getCached(provider, mediaId)` / `setCached(provider, mediaId, json, ttlHours=24)` using `MediaCache`. Search-level caching: cache by `provider + normalized query` is acceptable; document the choice in a comment. Commit.

### Task 3.5: Search API route

**Files:**
- Create: `app/api/search/[type]/route.ts`

GET `?q=...`; switch on `type` → anilist or stub; return `{ available, results }`; never 500 on provider failure — return `{ available: true, results: [], error: "..." }`. Commit.

---

## Phase 4 — UI: Dashboard & Create Flow

### Task 4.1: TournamentList + Dashboard page

**Files:**
- Create: `components/TournamentList.tsx`
- Modify: `app/page.tsx`

Server component: fetch `listTournaments()`, render branded cards with status chips (setup=ash, live=red glow, done=steel) and a prominent red "Create Tournament" link to `/tournament/create`. Empty state: "No tournaments yet — start one." Commit.

### Task 4.2: Create wizard — size + names

**Files:**
- Create: `app/tournament/create/page.tsx`
- Create: `components/CreateWizard.tsx`

Client component, two steps: (1) choose size 8/16/32/64; (2) add competitors — a repeating row with a name input, plus a bulk "paste names (one per line)" textarea that splits into rows. "Randomize seeds" toggle. Submit → server action `createTournament` + `addParticipants`, redirect to setup view. Validate with Zod (non-empty name, count ≤ size). Commit.

### Task 4.3: MediaSearch component

**Files:**
- Create: `components/MediaSearch.tsx`

Client component used per competitor row: tabs anime/cartoon/game; debounced query to `/api/search/[type]`; show result thumbnails + titles; selecting one attaches `mediaId/title/imageUrl/mediaType` to that competitor. Cartoon/game tabs show a "coming soon" panel when `available === false`. Manual name always wins if no media selected. Commit.

### Task 4.4: Setup/edit view + go live

**Files:**
- Create: `app/tournament/[id]/setup/page.tsx`

Show competitors with seeds (drag to reorder OR a simple seed number input — pick the simpler input approach for v1), "Randomize," and a red "Generate Bracket & Go Live" button → `generateAndSaveBracket(id)` → redirect to `/tournament/[id]`. Guard: button disabled until enough competitors. Commit.

---

## Phase 5 — UI: Bracket View (the screen-shared star)

### Task 5.1: CompetitorCard + MatchCard

**Files:**
- Create: `components/CompetitorCard.tsx`
- Create: `components/MatchCard.tsx`

`CompetitorCard`: cover art (or initials fallback), name in display font, winner state = red glow + bold, loser state = dimmed. `MatchCard`: stacks two competitor cards with a connector; if the match is `ready` (both slots filled, no winner) each competitor is a clickable button. Commit.

### Task 5.2: BracketTree layout

**Files:**
- Create: `components/BracketTree.tsx`

Render matches grouped by round in columns left→right, vertically centered so each later-round match sits between its two feeders. CSS grid/flex with spacing that doubles each round. Horizontal scroll for 64-size. The final/champion gets a highlighted slot. Commit.

### Task 5.3: Bracket page + advance action

**Files:**
- Create: `app/tournament/[id]/page.tsx`
- Create: `app/tournament/[id]/actions.ts`

Server component loads tournament + matches → `BracketTree`. `actions.ts` exposes `advanceWinner(tournamentId, round, position, winnerId)` server action calling `advanceMatch`, then `revalidatePath`. Clicking a competitor in a ready match calls it; page re-renders with the winner advanced (this is what the streamer screen-shares). When champion exists, show a branded "CHAMPION" banner. Commit.

### Task 5.4: Advance animation

Add the katana-slash highlight: on winner set, the winning `CompetitorCard` gets a brief red-glow + slash CSS animation (`@keyframes`). Keep it subtle and fast (~400ms). Commit.

---

## Phase 6 — Polish & Deploy

### Task 6.1: Favicon + square mark
Create a square "katana-C" mark from the logo for `app/icon.png` / favicon. Commit.

### Task 6.2: Empty/loading/error states
Add `loading.tsx` and `error.tsx` for the tournament routes; skeletons in dojo styling. Commit.

### Task 6.3: README + env example
Write `README.md` (run, env vars, AniList note, TMDB/IGDB "stubbed — add keys later") and `.env.example` with `DATABASE_URL`. Commit.

### Task 6.4: Vercel deploy config
Add `postinstall: prisma generate` to package.json scripts, verify `npm run build` passes locally, document Vercel env setup in README. Commit.

### Task 6.5: Final verification
> REQUIRED SUB-SKILL: superpowers:verification-before-completion

Run `npm test` (all green), `npm run build` (succeeds), and manually click through: create → add competitors with AniList art → go live → advance to champion. Record results before claiming done.

---

## Out of scope for v1 (YAGNI)
- TMDB/IGDB real integration (stubbed; interface ready)
- Auth / multi-user (public by design — screen-shared)
- SSE/WebSockets live sync (not needed for single screen)
- Double elimination, third-place match, group stages
- CSV/JSON import (bulk paste covers the need)
