"use client";

import { useCallback, useId, useState } from "react";
import { Eye, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_WALL_W = 360;
const DEFAULT_WALL_H = 270;

export function RoomPreview({
  artworkImageUrl,
  artworkWidthCm,
  artworkHeightCm,
  wallWidthCm = DEFAULT_WALL_W,
  wallHeightCm = DEFAULT_WALL_H,
}: {
  artworkImageUrl: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  wallWidthCm?: number;
  wallHeightCm?: number;
}) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [roomDataUrl, setRoomDataUrl] = useState<string | null>(null);

  const onFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setRoomDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const aspect = artworkWidthCm / Math.max(artworkHeightCm, 1);
  const widthPct = Math.min(
    88,
    Math.max(12, (artworkWidthCm / Math.max(wallWidthCm, 1)) * 100),
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Eye className="size-4" />
        See in my room
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Room preview</DialogTitle>
          <DialogDescription>
            Upload a photo of your wall. We will overlay the piece at a scale
            derived from your wall size ({wallWidthCm} × {wallHeightCm} cm from
            your profile, or defaults) versus the artwork dimensions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor={inputId} className="sr-only">
              Room photo
            </Label>
            <Input
              id={inputId}
              type="file"
              accept="image/*"
              className="max-w-xs cursor-pointer"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <Upload className="size-3.5" />
              Choose photo
            </Button>
          </div>

          <div className="relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            {roomDataUrl ? (
              <>
                <img
                  src={roomDataUrl}
                  alt="Your room"
                  className="block max-h-[min(70vh,560px)] w-full object-contain"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-[6%]">
                  <div
                    className="relative shadow-2xl ring-[3px] ring-white/90"
                    style={{
                      width: `${widthPct}%`,
                      aspectRatio: `${aspect}`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <img
                      src={artworkImageUrl}
                      alt="Artwork overlay"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
                <Upload className="size-8 opacity-40" />
                <p className="max-w-sm text-sm">
                  Add a room photo to preview placement. The frame scales with
                  your wall width reference ({wallWidthCm} cm).
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
