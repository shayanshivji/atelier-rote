import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artworks,
  artists,
  collectionItems,
  favorites,
  onboardingProfiles,
  plans,
  subscriptions,
} from "@/lib/schema";
import { and, eq, ne } from "drizzle-orm";

import { ArtworkDetailClient } from "@/components/artwork-detail-client";
import { ImageCarousel } from "@/components/image-carousel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function tierRank(label: string): number {
  const s = label.toLowerCase();
  if (s.includes("collector")) return 3;
  if (s.includes("premium")) return 2;
  return 1;
}

function planCoversArtwork(planName: string, artworkTier: string): boolean {
  return tierRank(planName) >= tierRank(artworkTier);
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      artwork: artworks,
      artist: artists,
    })
    .from(artworks)
    .innerJoin(artists, eq(artworks.artistId, artists.id))
    .where(eq(artworks.id, id))
    .limit(1);

  if (!row) notFound();

  const { artwork: a, artist: ar } = row;
  const imageUrls = parseJsonArray(a.imageUrls);
  const styles = parseJsonArray(a.styles);

  const session = await auth();
  const userId = session?.user?.id;

  let favorited = false;
  let isSubscribed = false;
  let planName = "";
  let planPiecesAllowed = 0;
  let collectionActiveCount = 0;
  let wallWidthCm = 360;
  let wallHeightCm = 270;

  if (userId) {
    const [fav] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.artworkId, id)))
      .limit(1);
    favorited = Boolean(fav);

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
      )
      .limit(1);

    if (sub) {
      isSubscribed = true;
      const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
      if (plan) {
        planName = plan.name;
        planPiecesAllowed = plan.piecesAllowed;
      }
      const activeItems = await db
        .select()
        .from(collectionItems)
        .where(
          and(
            eq(collectionItems.userId, userId),
            eq(collectionItems.status, "ACTIVE"),
          ),
        );
      collectionActiveCount = activeItems.length;
    }

    const [profile] = await db
      .select()
      .from(onboardingProfiles)
      .where(eq(onboardingProfiles.userId, userId))
      .limit(1);
    if (profile) {
      wallWidthCm = profile.wallWidth;
      wallHeightCm = profile.wallHeight;
    }
  }

  const includedInPlan =
    isSubscribed && planName ? planCoversArtwork(planName, a.tier) : false;
  const collectionAtLimit =
    isSubscribed && planPiecesAllowed > 0
      ? collectionActiveCount >= planPiecesAllowed
      : false;

  const pool = await db
    .select({
      artwork: artworks,
      artist: artists,
    })
    .from(artworks)
    .innerJoin(artists, eq(artworks.artistId, artists.id))
    .where(ne(artworks.id, id));

  const scored = pool
    .map((r) => {
      const st = parseJsonArray(r.artwork.styles);
      const overlap = st.filter((s) => styles.includes(s)).length;
      const sameArtist = r.artwork.artistId === a.artistId ? 2 : 0;
      return { ...r, score: overlap + sameArtist };
    })
    .sort((x, y) => y.score - x.score || y.artwork.retailPrice - x.artwork.retailPrice)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#faf9f7] text-foreground">
      <div className="border-b border-foreground/10 bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link
            href="/discover"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to Discover
          </Link>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Atelier Rote
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="space-y-6">
            <ImageCarousel imageUrls={imageUrls} alt={a.title} />
            {!a.available && (
              <p className="text-sm text-muted-foreground">
                This piece is currently held in a member collection.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-10">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{a.tier}</Badge>
                <Badge variant="secondary" className="tabular-nums">
                  ${a.retailPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Badge>
                {includedInPlan && isSubscribed && (
                  <Badge className="bg-emerald-700 text-white hover:bg-emerald-700/90">
                    Included in your plan
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">
                {a.title}
              </h1>
              <div className="space-y-1">
                <p className="text-lg text-muted-foreground">{ar.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {a.width} &times; {a.height} cm
                </p>
              </div>
            </header>

            <ArtworkDetailClient
              artworkId={a.id}
              title={a.title}
              retailPrice={a.retailPrice}
              coverImageUrl={imageUrls[0] ?? ""}
              widthCm={a.width}
              heightCm={a.height}
              wallWidthCm={wallWidthCm}
              wallHeightCm={wallHeightCm}
              favorited={favorited}
              isLoggedIn={Boolean(userId)}
              isSubscribed={isSubscribed}
              collectionAtLimit={collectionAtLimit}
            />

            <Separator className="bg-foreground/10" />

            <section className="space-y-4">
              <h2 className="font-serif text-2xl tracking-tight">About the artist</h2>
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {ar.bio}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl tracking-tight">Style</h2>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl tracking-tight">About the work</h2>
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {a.description}
              </p>
            </section>
          </div>
        </div>

        <section className="mt-24 border-t border-foreground/10 pt-16">
          <h2 className="font-serif text-3xl tracking-tight">Related works</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Pieces that share palette or lineage with what you are viewing.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {scored.map(({ artwork: rel, artist: relArt }) => {
              const urls = parseJsonArray(rel.imageUrls);
              const thumb = urls[0];
              return (
                <Link key={rel.id} href={`/art/${rel.id}`}>
                  <Card className="h-full overflow-hidden border-foreground/10 bg-white shadow-none transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/5] bg-muted">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-1 pt-4">
                      <p className="font-serif text-lg leading-snug">{rel.title}</p>
                      <p className="text-sm text-muted-foreground">{relArt.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </article>
    </div>
  );
}
