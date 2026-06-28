import { describe, it, expect } from "vitest";
import { nextPowerOfTwo, seedOrder } from "./bracket";

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
