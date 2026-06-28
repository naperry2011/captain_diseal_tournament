import { describe, it, expect } from "vitest";
import { nextPowerOfTwo } from "./bracket";

describe("nextPowerOfTwo", () => {
  it("returns 8 for 5..8", () => { expect(nextPowerOfTwo(5)).toBe(8); expect(nextPowerOfTwo(8)).toBe(8); });
  it("returns 16 for 9..16", () => { expect(nextPowerOfTwo(12)).toBe(16); });
  it("returns 64 for 33..64", () => { expect(nextPowerOfTwo(64)).toBe(64); });
});
