"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { addToCollection, toggleFavorite } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { RoomPreview } from "@/components/room-preview";

export function ArtworkDetailClient({
  artworkId,
  title,
  retailPrice,
  coverImageUrl,
  widthCm,
  heightCm,
  wallWidthCm,
  wallHeightCm,
  favorited: initialFavorited,
  isLoggedIn,
  isSubscribed,
  collectionAtLimit,
}: {
  artworkId: string;
  title: string;
  retailPrice: number;
  coverImageUrl: string;
  widthCm: number;
  heightCm: number;
  wallWidthCm: number;
  wallHeightCm: number;
  favorited: boolean;
  isLoggedIn: boolean;
  isSubscribed: boolean;
  collectionAtLimit: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onFavorite = () => {
    if (!isLoggedIn) {
      toast.message("Sign in to save favorites");
      return;
    }
    startTransition(async () => {
      try {
        const res = await toggleFavorite(artworkId);
        setFavorited(res.favorited);
        router.refresh();
      } catch {
        toast.error("Could not update favorites");
      }
    });
  };

  const onAddToCollection = () => {
    if (!isLoggedIn) {
      toast.message("Sign in to add to your collection");
      return;
    }
    if (!isSubscribed) {
      toast.message("An active subscription is required");
      return;
    }
    startTransition(async () => {
      const res = await addToCollection(artworkId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Added to your collection");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={favorited ? "secondary" : "outline"}
          size="lg"
          className="gap-2"
          disabled={pending}
          onClick={onFavorite}
        >
          <Heart
            className={`size-4 ${favorited ? "fill-current text-red-600" : ""}`}
          />
          {favorited ? "Saved" : "Add to favorites"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={pending || !isSubscribed || collectionAtLimit}
          onClick={onAddToCollection}
          title={
            collectionAtLimit
              ? "Your plan is at capacity"
              : !isSubscribed
                ? "Subscribe to borrow works"
                : undefined
          }
        >
          <ShoppingBag className="size-4" />
          Add to My Collection
        </Button>

        <Button
          type="button"
          size="lg"
          className="gap-2"
          onClick={() => setCheckoutOpen(true)}
        >
          Buy this piece
        </Button>
      </div>

      <div className="w-full pt-2">
        <RoomPreview
          artworkImageUrl={coverImageUrl}
          artworkWidthCm={widthCm}
          artworkHeightCm={heightCm}
          wallWidthCm={wallWidthCm}
          wallHeightCm={wallHeightCm}
        />
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Checkout</DialogTitle>
            <DialogDescription>
              Mock checkout for <span className="text-foreground">{title}</span>.
              No payment is processed in this preview build.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-foreground/10 bg-muted/40 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retail</span>
              <span className="font-medium tabular-nums">
                ${retailPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <Separator className="my-3" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Atelier Rote would collect shipping and finalize insurance here.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => setCheckoutOpen(false)}>
              Complete (mock)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
