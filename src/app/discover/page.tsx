import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artworks,
  artists,
  favorites,
  onboardingProfiles,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scoreArtwork, type ArtworkData, type ProfileData } from "@/lib/recommendations";
import { DiscoverClient, type DiscoverArtwork } from "@/components/discover-client";

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function rowToProfileData(row: typeof onboardingProfiles.$inferSelect): ProfileData {
  return {
    styles: parseJsonArray(row.styles),
    colors: parseJsonArray(row.colors),
    wallWidth: row.wallWidth,
    wallHeight: row.wallHeight,
    budgetTier: row.budgetTier,
  };
}

export default async function DiscoverPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const rows = await db
    .select({
      artwork: artworks,
      artist: artists,
    })
    .from(artworks)
    .innerJoin(artists, eq(artworks.artistId, artists.id));

  let profile: ProfileData | null = null;
  if (userId) {
    const [p] = await db
      .select()
      .from(onboardingProfiles)
      .where(eq(onboardingProfiles.userId, userId))
      .limit(1);
    if (p) profile = rowToProfileData(p);
  }

  let favoriteIds: string[] = [];
  if (userId) {
    const favRows = await db
      .select({ artworkId: favorites.artworkId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    favoriteIds = favRows.map((r) => r.artworkId);
  }

  const items: DiscoverArtwork[] = rows.map(({ artwork: a, artist: ar }) => {
    const styles = parseJsonArray(a.styles);
    const colors = parseJsonArray(a.colors);
    const imageUrls = parseJsonArray(a.imageUrls);

    const scoreInput: ArtworkData = {
      id: a.id,
      styles,
      colors,
      width: a.width,
      height: a.height,
      tier: a.tier,
    };

    const score = profile ? scoreArtwork(scoreInput, profile) : 0;

    return {
      id: a.id,
      title: a.title,
      artistId: a.artistId,
      artistName: ar.name,
      imageUrls,
      styles,
      colors,
      width: a.width,
      height: a.height,
      tier: a.tier,
      description: a.description,
      retailPrice: a.retailPrice,
      available: a.available,
      score,
    };
  });

  return (
    <DiscoverClient
      artworks={items}
      profile={profile}
      initialFavoriteIds={favoriteIds}
      isLoggedIn={Boolean(userId)}
    />
  );
}
