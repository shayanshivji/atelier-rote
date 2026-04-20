export interface ArtworkData {
  id: string;
  styles: string[];
  colors: string[];
  width: number;
  height: number;
  tier: string;
}

export interface ProfileData {
  styles: string[];
  colors: string[];
  wallWidth: number;
  wallHeight: number;
  budgetTier: string;
}

export function scoreArtwork(artwork: ArtworkData, profile: ProfileData): number {
  let score = 0;

  const styleOverlap = artwork.styles.filter((s) => profile.styles.includes(s)).length;
  score += (styleOverlap / Math.max(profile.styles.length, 1)) * 40;

  const colorOverlap = artwork.colors.filter((c) => profile.colors.includes(c)).length;
  score += (colorOverlap / Math.max(profile.colors.length, 1)) * 30;

  const fitsWidth = artwork.width <= profile.wallWidth;
  const fitsHeight = artwork.height <= profile.wallHeight;
  if (fitsWidth && fitsHeight) {
    const areaCoverage =
      (artwork.width * artwork.height) / (profile.wallWidth * profile.wallHeight);
    score += areaCoverage > 0.15 && areaCoverage < 0.85 ? 15 : 8;
  }

  const tierMap: Record<string, number> = {
    Basic: 1, essential: 1,
    Premium: 2, signature: 2,
    Collector: 3, concierge: 3,
  };
  const artTier = tierMap[artwork.tier] ?? 1;
  const profTier = tierMap[profile.budgetTier] ?? 1;
  if (artTier === profTier) score += 15;
  else if (Math.abs(artTier - profTier) === 1) score += 8;

  return Math.min(100, Math.round(score));
}

export function rankArtworks(artworks: ArtworkData[], profile: ProfileData) {
  return artworks
    .map((a) => ({ ...a, score: scoreArtwork(a, profile) }))
    .sort((a, b) => b.score - a.score);
}
