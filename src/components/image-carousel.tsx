"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageCarousel({
  imageUrls,
  alt,
  className,
}: {
  imageUrls: string[];
  alt: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const n = imageUrls.length;
  if (n === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[4/5] w-full items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        No images
      </div>
    );
  }

  const safe = ((index % n) + n) % n;
  const src = imageUrls[safe];

  return (
    <div className={cn("relative w-full overflow-hidden bg-muted", className)}>
      <img
        src={src}
        alt={`${alt} — ${safe + 1} of ${n}`}
        className="aspect-[4/5] w-full object-contain md:aspect-auto md:max-h-[min(78vh,920px)] md:min-h-[420px]"
      />
      {n > 1 && (
        <>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 shadow-sm"
            aria-label="Previous image"
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 shadow-sm"
            aria-label="Next image"
            onClick={() => setIndex((i) => i + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full bg-white/40",
                  i === safe && "bg-white",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
