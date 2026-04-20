import { describe, it, expect } from "vitest";

function enforcePlanLimit(activeCount: number, piecesAllowed: number): { allowed: boolean; error?: string } {
  if (activeCount >= piecesAllowed) {
    return {
      allowed: false,
      error: `Your plan allows ${piecesAllowed} piece(s). Schedule a swap to change artwork.`,
    };
  }
  return { allowed: true };
}

describe("enforcePlanLimit", () => {
  it("allows adding when under the limit", () => {
    const result = enforcePlanLimit(0, 1);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("blocks adding when at the limit (Basic plan - 1 piece)", () => {
    const result = enforcePlanLimit(1, 1);
    expect(result.allowed).toBe(false);
    expect(result.error).toContain("1 piece(s)");
  });

  it("allows Premium plan up to 2 pieces", () => {
    expect(enforcePlanLimit(0, 2).allowed).toBe(true);
    expect(enforcePlanLimit(1, 2).allowed).toBe(true);
    expect(enforcePlanLimit(2, 2).allowed).toBe(false);
  });

  it("allows Collector plan up to 3 pieces", () => {
    expect(enforcePlanLimit(0, 3).allowed).toBe(true);
    expect(enforcePlanLimit(1, 3).allowed).toBe(true);
    expect(enforcePlanLimit(2, 3).allowed).toBe(true);
    expect(enforcePlanLimit(3, 3).allowed).toBe(false);
  });

  it("blocks when already over limit (edge case)", () => {
    const result = enforcePlanLimit(5, 2);
    expect(result.allowed).toBe(false);
  });

  it("returns correct error message with plan limit", () => {
    const result = enforcePlanLimit(3, 3);
    expect(result.error).toBe("Your plan allows 3 piece(s). Schedule a swap to change artwork.");
  });
});
