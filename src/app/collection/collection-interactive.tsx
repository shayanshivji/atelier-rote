"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Package, Truck } from "lucide-react";

import { scheduleSwap } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CollectionArtwork = {
  id: string;
  title: string;
  artistName: string;
  imageUrl: string;
  tier: string;
  width: number;
  height: number;
};

export type CollectionSwap = {
  id: string;
  status: string;
  scheduledAtIso: string;
  deliveryType: string;
  createdAtIso: string;
};

type Props = {
  planName: string;
  nextSwapIso: string;
  items: CollectionArtwork[];
  swaps: CollectionSwap[];
};

function formatLong(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function localDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CollectionInteractive({
  planName,
  nextSwapIso,
  items,
  swaps,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function runEarlySwap() {
    startTransition(async () => {
      const today = localDateInputValue(new Date());
      await scheduleSwap({
        scheduledDate: today,
        scheduledTime: "10:00",
        deliveryType: "Standard",
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-muted-foreground mb-2 text-xs tracking-[0.2em] uppercase">
            Membership · {planName}
          </p>
          <h1 className="text-foreground text-3xl font-light tracking-tight sm:text-4xl">
            Your collection
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
            Pieces on your walls now, with concierge logistics for every
            rotation.
          </p>
        </div>
        <div className="bg-card border-foreground/10 flex flex-col gap-3 rounded-xl border px-5 py-4 ring-1 ring-foreground/5">
          <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
            <Calendar className="size-3.5" aria-hidden />
            Next swap
          </div>
          <p className="text-foreground text-lg font-medium tracking-tight">
            {formatLong(nextSwapIso)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/swap"
              className={cn(buttonVariants({ size: "sm" }), "h-9 px-4")}
            >
              Schedule swap
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 px-4"
                )}
              >
                Swap early
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    Early swap fee
                  </DialogTitle>
                  <DialogDescription>
                    Requesting a swap before your scheduled window includes a{" "}
                    <span className="text-foreground font-medium">$99</span>{" "}
                    logistics fee. Your current pieces will be collected and
                    the next curation prepared on the expedited timeline.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/50 text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-xs leading-relaxed">
                  This is a mock checkout step—confirming will run the same swap
                  flow as a scheduled rotation in the demo app.
                </div>
                <DialogFooter className="gap-2 sm:justify-end">
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cn(buttonVariants({ size: "sm" }), "h-9")}
                    disabled={pending}
                    onClick={runEarlySwap}
                  >
                    {pending ? "Processing…" : "Pay fee & swap"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-6 text-xs font-medium tracking-[0.2em] uppercase">
          On your walls
        </h2>
        {items.length === 0 ? (
          <Card className="border-foreground/10 border-dashed">
            <CardHeader>
              <CardTitle className="font-heading text-base font-medium">
                No pieces yet
              </CardTitle>
              <CardDescription>
                Browse the catalog and add works up to your plan limit.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {items.map((piece) => (
              <Card
                key={piece.id}
                className="border-foreground/10 overflow-hidden pt-0"
              >
                <div className="bg-muted relative aspect-[4/3] w-full">
                  <Image
                    src={piece.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-heading text-lg font-medium tracking-tight">
                      {piece.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {piece.tier}
                    </Badge>
                  </div>
                  <CardDescription>{piece.artistName}</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Package className="size-3.5" aria-hidden />
                  {piece.width} × {piece.height} cm · Rented
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-6 flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase">
          <Truck className="size-3.5" aria-hidden />
          Swap history
        </h2>
        {swaps.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No swaps yet—your timeline will appear here.
          </p>
        ) : (
          <ol className="border-border relative space-y-10 border-l border-dashed pl-8">
            {swaps.map((swap) => (
              <li key={swap.id} className="relative">
                <span
                  className="bg-card border-foreground/15 absolute -left-[9px] top-1 size-3 rounded-full border ring-4 ring-background"
                  aria-hidden
                />
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {formatLong(swap.scheduledAtIso)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {swap.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatTime(swap.scheduledAtIso)} · {swap.deliveryType}{" "}
                    delivery
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
