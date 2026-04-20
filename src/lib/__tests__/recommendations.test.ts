import { describe, it, expect } from "vitest";
import { scoreArtwork, rankArtworks, type ArtworkData, type ProfileData } from "../recommendations";

const baseProfile: ProfileData = {
  styles: ["Minimal", "Abstract", "Modern"],
  colors: ["Blue", "White"],
  wallWidth: 120,
  wallHeight: 96,
  budgetTier: "Premium",
};

const baseArtwork: ArtworkData = {
  id: "art-1",
  styles: ["Minimal", "Abstract"],
  colors: ["Blue", "White"],
  width: 36,
  height: 48,
  tier: "Premium",
};

describe("scoreArtwork", () => {
  it("returns a high score for a perfect match", () => {
    const score = scoreArtwork(baseArtwork, baseProfile);
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns a low score when nothing matches", () => {
    const mismatch: ArtworkData = {
      id: "art-2",
      styles: ["Classic", "Bold"],
      colors: ["Red", "Gold"],
      width: 200,
      height: 200,
      tier: "Basic",
    };
    const score = scoreArtwork(mismatch, baseProfile);
    expect(score).toBeLessThan(30);
  });

  it("gives style overlap score proportional to match count", () => {
    const oneStyle: ArtworkData = { ...baseArtwork, styles: ["Minimal"] };
    const twoStyles: ArtworkData = { ...baseArtwork, styles: ["Minimal", "Abstract"] };
    expect(scoreArtwork(twoStyles, baseProfile)).toBeGreaterThan(scoreArtwork(oneStyle, baseProfile));
  });

  it("gives color overlap score proportional to match count", () => {
    const oneColor: ArtworkData = { ...baseArtwork, colors: ["Blue"] };
    const twoColors: ArtworkData = { ...baseArtwork, colors: ["Blue", "White"] };
    expect(scoreArtwork(twoColors, baseProfile)).toBeGreaterThan(scoreArtwork(oneColor, baseProfile));
  });

  it("gives full tier score for exact match", () => {
    const exact = scoreArtwork({ ...baseArtwork, tier: "Premium" }, baseProfile);
    const adjacent = scoreArtwork({ ...baseArtwork, tier: "Basic" }, baseProfile);
    const far = scoreArtwork({ ...baseArtwork, tier: "Collector" }, baseProfile);
    expect(exact).toBeGreaterThan(adjacent);
    expect(adjacent).toBeGreaterThanOrEqual(far);
  });

  it("penalizes artwork too large for the wall", () => {
    const fits = scoreArtwork({ ...baseArtwork, width: 36, height: 48 }, baseProfile);
    const tooLarge = scoreArtwork({ ...baseArtwork, width: 200, height: 200 }, baseProfile);
    expect(fits).toBeGreaterThan(tooLarge);
  });

  it("caps score at 100", () => {
    const score = scoreArtwork(baseArtwork, baseProfile);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("handles empty profile styles gracefully", () => {
    const emptyProfile = { ...baseProfile, styles: [] };
    const score = scoreArtwork(baseArtwork, emptyProfile);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("rankArtworks", () => {
  it("sorts artworks by score descending", () => {
    const artworks: ArtworkData[] = [
      { id: "a1", styles: ["Classic"], colors: ["Red"], width: 20, height: 20, tier: "Basic" },
      { id: "a2", styles: ["Minimal", "Abstract", "Modern"], colors: ["Blue", "White"], width: 36, height: 48, tier: "Premium" },
      { id: "a3", styles: ["Abstract"], colors: ["Blue"], width: 30, height: 30, tier: "Premium" },
    ];
    const ranked = rankArtworks(artworks, baseProfile);
    expect(ranked[0].id).toBe("a2");
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });

  it("returns all artworks with scores attached", () => {
    const artworks: ArtworkData[] = [
      { id: "x1", styles: ["Bold"], colors: ["Red"], width: 40, height: 40, tier: "Basic" },
    ];
    const ranked = rankArtworks(artworks, baseProfile);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toHaveProperty("score");
    expect(typeof ranked[0].score).toBe("number");
  });
});
