import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artists,
  artworks,
  collectionItems,
  plans,
  subscriptions,
  swapOrders,
} from "@/lib/schema";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  CollectionInteractive,
  type CollectionArtwork,
  type CollectionSwap,
} from "./collection-interactive";

export const metadata = {
  title: "My collection | Atelier Rote",
  description: "Active rentals and swap history.",
};

function firstImageUrl(imageUrlsJson: string): string {
  try {
    const parsed = JSON.parse(imageUrlsJson) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return parsed[0];
    }
  } catch {
    /* ignore */
  }
  return "https://picsum.photos/seed/placeholder/800/600";
}

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const userId = session.user.id;

  const [subRow] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    )
    .limit(1);

  if (!subRow) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col gap-10 px-6 py-24 text-center">
        <div>
          <h1 className="text-foreground mb-3 text-3xl font-light tracking-tight">
            No active subscription
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Become a member to curate rotating works in your space—insured
            delivery, flexible swaps, and collector pricing when you fall in
            love with a piece.
          </p>
        </div>
        <Card className="border-foreground/10 text-left">
          <CardHeader>
            <CardTitle className="font-heading text-base font-medium">
              Explore plans
            </CardTitle>
            <CardDescription>
              Essential, Signature, and Concierge tiers for every space.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: "lg" }), "h-10 w-full")}
            >
              View pricing
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joined = await db
    .select({
      item: collectionItems,
      artwork: artworks,
      artist: artists,
    })
    .from(collectionItems)
    .innerJoin(artworks, eq(collectionItems.artworkId, artworks.id))
    .innerJoin(artists, eq(artworks.artistId, artists.id))
    .where(
      and(eq(collectionItems.userId, userId), eq(collectionItems.status, "ACTIVE"))
    );

  const items: CollectionArtwork[] = joined.map((row) => ({
    id: row.item.id,
    title: row.artwork.title,
    artistName: row.artist.name,
    imageUrl: firstImageUrl(row.artwork.imageUrls),
    tier: row.artwork.tier,
    width: row.artwork.width,
    height: row.artwork.height,
  }));

  const swapRows = await db
    .select()
    .from(swapOrders)
    .where(eq(swapOrders.userId, userId))
    .orderBy(desc(swapOrders.createdAt));

  const swaps: CollectionSwap[] = swapRows.map((s) => ({
    id: s.id,
    status: s.status,
    scheduledAtIso: s.scheduledAt.toISOString(),
    deliveryType: s.deliveryType,
    createdAtIso: s.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <CollectionInteractive
        planName={subRow.plan.name}
        nextSwapIso={subRow.subscription.nextSwapDate.toISOString()}
        items={items}
        swaps={swaps}
      />
    </div>
  );
}
