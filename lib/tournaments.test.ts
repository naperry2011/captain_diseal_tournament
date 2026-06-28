import { describe, expect, it } from "vitest";
import { advance, champion, generateBracket } from "@/lib/bracket";
import {
  type MatchRow,
  diffMatches,
  matchStatusFor,
  rowsToBracket,
} from "@/lib/bracket-persist";

describe("matchStatusFor", () => {
  it("returns done when a winner is set (even if a slot is empty)", () => {
    expect(matchStatusFor("a", "b", "a")).toBe("done");
    expect(matchStatusFor("a", null, "a")).toBe("done");
  });

  it("returns ready when both participants present and no winner", () => {
    expect(matchStatusFor("a", "b", null)).toBe("ready");
  });

  it("returns pending when a slot is empty and no winner", () => {
    expect(matchStatusFor("a", null, null)).toBe("pending");
    expect(matchStatusFor(null, "b", null)).toBe("pending");
    expect(matchStatusFor(null, null, null)).toBe("pending");
  });
});

describe("rowsToBracket", () => {
  it("round-trips a known set of rows into a sorted Bracket", () => {
    const rows: MatchRow[] = [
      { round: 2, position: 0, p1Id: null, p2Id: null, winnerId: null },
      { round: 1, position: 1, p1Id: "c", p2Id: "d", winnerId: null },
      { round: 1, position: 0, p1Id: "a", p2Id: "b", winnerId: "a" },
    ];
    const bracket = rowsToBracket(4, rows);

    expect(bracket.size).toBe(4);
    // sorted by round then position
    expect(bracket.matches.map((m) => [m.round, m.position])).toEqual([
      [1, 0],
      [1, 1],
      [2, 0],
    ]);
    expect(bracket.matches[0]).toEqual({
      round: 1,
      position: 0,
      p1Id: "a",
      p2Id: "b",
      winnerId: "a",
    });
  });

  it("is the inverse of generateBracket's match data (engine round-trip)", () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `P${i + 1}`,
      seed: i + 1,
    }));
    const generated = generateBracket(participants);

    const rows: MatchRow[] = generated.matches.map((m) => ({
      round: m.round,
      position: m.position,
      p1Id: m.p1Id,
      p2Id: m.p2Id,
      winnerId: m.winnerId,
    }));
    const rebuilt = rowsToBracket(generated.size, rows);

    expect(rebuilt.size).toBe(generated.size);
    expect(rebuilt.matches).toEqual(
      [...generated.matches].sort(
        (a, b) => a.round - b.round || a.position - b.position,
      ),
    );
  });
});

describe("diffMatches", () => {
  // 4-player bracket: round 1 has two full matches, round 2 is the final.
  const participants = Array.from({ length: 4 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `P${i + 1}`,
    seed: i + 1,
  }));

  it("advancing a round-1 winner yields a 2-row diff: decided match done, next slot filled", () => {
    const before = generateBracket(participants);
    const r1m0 = before.matches.find((m) => m.round === 1 && m.position === 0)!;
    const winnerId = r1m0.p1Id!;

    const after = advance(before, 1, 0, winnerId);
    const diff = diffMatches(before, after);

    expect(diff).toHaveLength(2);

    const decided = diff.find((d) => d.round === 1 && d.position === 0)!;
    expect(decided.winnerId).toBe(winnerId);
    expect(decided.status).toBe("done");

    // Round-1 position 0 feeds the final (round 2, position 0), p1 slot.
    const next = diff.find((d) => d.round === 2 && d.position === 0)!;
    expect(next.p1Id).toBe(winnerId);
    expect(next.winnerId).toBeNull();
    // Other finalist not yet decided -> pending.
    expect(next.status).toBe("pending");
  });

  it("filling the final's second slot makes it ready", () => {
    const start = generateBracket(participants);
    const afterFirst = advance(
      start,
      1,
      0,
      start.matches.find((m) => m.round === 1 && m.position === 0)!.p1Id!,
    );
    const secondWinner = afterFirst.matches.find(
      (m) => m.round === 1 && m.position === 1,
    )!.p1Id!;

    const afterSecond = advance(afterFirst, 1, 1, secondWinner);
    const diff = diffMatches(afterFirst, afterSecond);

    const finalDiff = diff.find((d) => d.round === 2 && d.position === 0)!;
    expect(finalDiff.p2Id).toBe(secondWinner);
    expect(finalDiff.status).toBe("ready");
  });

  it("returns an empty diff when nothing changed", () => {
    const b = generateBracket(participants);
    expect(diffMatches(b, b)).toEqual([]);
  });
});

// Documents the trigger condition advanceMatch uses to flip a tournament to
// `done`: champion(after) stays null until the final is decided, then becomes
// the winner id. (The DB write itself isn't unit-tested — no DB here.)
describe("champion() done-transition trigger", () => {
  const participants = Array.from({ length: 4 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `P${i + 1}`,
    seed: i + 1,
  }));

  it("is null until the final is decided, then equals the final winner", () => {
    const start = generateBracket(participants);
    expect(champion(start)).toBeNull();

    const afterR1m0 = advance(
      start,
      1,
      0,
      start.matches.find((m) => m.round === 1 && m.position === 0)!.p1Id!,
    );
    expect(champion(afterR1m0)).toBeNull();

    const afterR1m1 = advance(
      afterR1m0,
      1,
      1,
      afterR1m0.matches.find((m) => m.round === 1 && m.position === 1)!.p1Id!,
    );
    // Final is now ready but not decided -> still no champion.
    expect(champion(afterR1m1)).toBeNull();

    const finalP1 = afterR1m1.matches.find(
      (m) => m.round === 2 && m.position === 0,
    )!.p1Id!;
    const afterFinal = advance(afterR1m1, 2, 0, finalP1);
    expect(champion(afterFinal)).toBe(finalP1);
  });
});
