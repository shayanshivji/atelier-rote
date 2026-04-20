import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  favorites,
  artworks,
  artists,
  boards,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { FavoritesClient } from "@/components/favorites-client";

export const metadata = {
  title: "Moodboard | Atelier Rote",
  description: "Saved pieces and inspiration boards",
};

export type FavoriteRow = {
  favoriteId: string;
  artworkId: string;
  boardId: string | null;
  title: string;
  artistName: string;
  imageUrl: string;
};

export type BoardRow = {
  id: string;
  name: string;
};

function firstImageUrl(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed[0];
    }
  } catch {
    /* ignore */
  }
  return "/file.svg";
}

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const userId = session.user.id;

  const [userExists] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!userExists) {
    redirect("/auth");
  }

  const boardRows = await db
    .select({ id: boards.id, name: boards.name })
    .from(boards)
    .where(eq(boards.userId, userId));

  const joined = await db
    .select({
      favoriteId: favorites.id,
      artworkId: favorites.artworkId,
      boardId: favorites.boardId,
      title: artworks.title,
      artistName: artists.name,
      imageUrls: artworks.imageUrls,
    })
    .from(favorites)
    .innerJoin(artworks, eq(favorites.artworkId, artworks.id))
    .innerJoin(artists, eq(artworks.artistId, artists.id))
    .where(eq(favorites.userId, userId));

  const favoriteRows: FavoriteRow[] = joined.map((row) => ({
    favoriteId: row.favoriteId,
    artworkId: row.artworkId,
    boardId: row.boardId,
    title: row.title,
    artistName: row.artistName,
    imageUrl: firstImageUrl(row.imageUrls),
  }));

  return (
    <div className="min-h-full bg-[#faf9f7] text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Atelier Rote
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight sm:text-4xl">
            Moodboard
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Curate saved works into boards—like tear sheets on a studio wall.
          </p>
        </header>

        <FavoritesClient initialFavorites={favoriteRows} initialBoards={boardRows} />
      </div>
    </div>
  );
}
