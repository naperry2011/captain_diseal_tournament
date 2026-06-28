import { describe, it, expect } from "vitest";
import { nextPowerOfTwo, seedOrder, generateBracket } from "./bracket";
import type { SeedEntry } from "./bracket";

const mk = (n: number): SeedEntry[] => Array.from({length:n},(_,i)=>({id:`p${i+1}`,name:`P${i+1}`,seed:i+1}));

describe("nextPowerOfTwo", () => {
  it("returns 8 for 5..8", () => { expect(nextPowerOfTwo(5)).toBe(8); expect(nextPowerOfTwo(8)).toBe(8); });
  it("returns 16 for 9..16", () => { expect(nextPowerOfTwo(12)).toBe(16); });
  it("returns 64 for 33..64", () => { expect(nextPowerOfTwo(64)).toBe(64); });
});

describe("seedOrder", () => {
  it("orders a size-4 bracket as [1,4,3,2]", () => { expect(seedOrder(4)).toEqual([1,4,3,2]); });
  it("orders a size-8 bracket as [1,8,5,4,3,6,7,2]", () => { expect(seedOrder(8)).toEqual([1,8,5,4,3,6,7,2]); });
  it("produces size entries that are a permutation of 1..size", () => {
    const o = seedOrder(16);
    expect(o).toHaveLength(16);
    expect([...o].sort((a,b)=>a-b)).toEqual(Array.from({length:16},(_,i)=>i+1));
  });
});

describe("generateBracket", () => {
  it("size is next power of two of participant count", () => {
    expect(generateBracket(mk(12)).size).toBe(16);
    expect(generateBracket(mk(8)).size).toBe(8);
  });
  it("round 1 has size/2 matches", () => {
    const r1 = generateBracket(mk(8)).matches.filter(m=>m.round===1);
    expect(r1).toHaveLength(4);
  });
  it("pairs seed 1 against seed 8 in an 8-player bracket", () => {
    const first = generateBracket(mk(8)).matches.find(m=>m.round===1&&m.position===0)!;
    expect(new Set([first.p1Id, first.p2Id])).toEqual(new Set(["p1","p8"]));
  });
  it("gives top seeds byes when not full (5 players in size 8)", () => {
    const b = generateBracket(mk(5));
    const seed1Match = b.matches.find(m=>m.round===1 && (m.p1Id==="p1"||m.p2Id==="p1"))!;
    const opp = seed1Match.p1Id==="p1" ? seed1Match.p2Id : seed1Match.p1Id;
    expect(opp).toBeNull();
    expect(seed1Match.winnerId).toBe("p1");
  });
  it("creates the full match tree (size-1 matches total)", () => {
    expect(generateBracket(mk(8)).matches).toHaveLength(7);
  });
});
