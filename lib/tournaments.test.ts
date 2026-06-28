import { describe, expect, it } from "vitest";
import { generateBracket } from "@/lib/bracket";
import { type MatchRow, matchStatusFor, rowsToBracket } from "@/lib/bracket-persist";

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
