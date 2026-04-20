"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleFavorite } from "@/lib/actions";
import type { ProfileData } from "@/lib/recommendations";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DiscoverArtwork = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  imageUrls: string[];
  styles: string[];
  colors: string[];
  width: number;
  height: number;
  tier: string;
  description: string;
  retailPrice: number;
  available: boolean;
  score: number;
};

type SortMode = "recommended" | "new" | "popular";

function toggle(list: string[], val: string) {
  return list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
}

export function DiscoverClient({
  artworks,
  profile,
  initialFavoriteIds,
  isLoggedIn,
}: {
  artworks: DiscoverArtwork[];
  profile: ProfileData | null;
  initialFavoriteIds: string[];
  isLoggedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [stylesSel, setStylesSel] = useState<string[]>([]);
  const [colorsSel, setColorsSel] = useState<string[]>([]);
  const [tiersSel, setTiersSel] = useState<string[]>([]);
  const [artistId, setArtistId] = useState("all");
  const [sort, setSort] = useState<SortMode>(profile ? "recommended" : "new");
  const [favs, setFavs] = useState(() => new Set(initialFavoriteIds));
  const [pending, startTransition] = useTransition();

  const allStyles = useMemo(() => [...new Set(artworks.flatMap((a) => a.styles))].sort(), [artworks]);
  const allColors = useMemo(() => [...new Set(artworks.flatMap((a) => a.colors))].sort(), [artworks]);
  const artistList = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of artworks) m.set(a.artistId, a.artistName);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [artworks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = artworks.filter((a) => {
      if (q && ![a.title, a.artistName, ...a.styles, ...a.colors, a.tier].join(" ").toLowerCase().includes(q)) return false;
      if (stylesSel.length && !stylesSel.some((s) => a.styles.includes(s))) return false;
      if (colorsSel.length && !colorsSel.some((c) => a.colors.includes(c))) return false;
      if (tiersSel.length && !tiersSel.some((t) => t.toLowerCase() === a.tier.toLowerCase())) return false;
      if (artistId !== "all" && a.artistId !== artistId) return false;
      return true;
    });
    if (sort === "recommended" && profile) list.sort((a, b) => b.score - a.score);
    else if (sort === "popular") list.sort((a, b) => b.retailPrice - a.retailPrice);
    else list.sort((a, b) => b.id.localeCompare(a.id));
    return list;
  }, [artworks, query, stylesSel, colorsSel, tiersSel, artistId, sort, profile]);

  const recommended = useMemo(() => {
    if (!profile) return [];
    return [...artworks].sort((a, b) => b.score - a.score).slice(0, 8);
  }, [artworks, profile]);

  const onFav = useCallback((id: string) => {
    if (!isLoggedIn) { toast.message("Sign in to save favorites"); return; }
    startTransition(async () => {
      try {
        const res = await toggleFavorite(id);
        setFavs((p) => { const n = new Set(p); res.favorited ? n.add(id) : n.delete(id); return n; });
      } catch { toast.error("Could not update favorites"); }
    });
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8 lg:pt-20">
        <div className="max-w-lg">
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground/60 uppercase">Collection</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-foreground lg:text-4xl">Discover</h1>
        </div>
        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm space-y-1.5">
            <Label htmlFor="search" className="text-[12px] text-muted-foreground">Search</Label>
            <Input
              id="search"
              placeholder="Title, artist, style\u2026"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-none border-border/50 bg-transparent text-sm"
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Sort</Label>
              <Select value={sort} onValueChange={(v) => setSort((v ?? "new") as SortMode)}>
                <SelectTrigger className="h-9 w-40 rounded-none border-border/50 bg-transparent text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Artist</Label>
              <Select value={artistId} onValueChange={(v) => setArtistId(v ?? "all")}>
                <SelectTrigger className="h-9 w-44 rounded-none border-border/50 bg-transparent text-sm">
                  <SelectValue placeholder="All artists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All artists</SelectItem>
                  {artistList.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
          {/* Main grid */}
          <div className="space-y-16">
            {profile && recommended.length > 0 && (
              <section>
                <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase">Recommended for you</p>
                <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
                  {recommended.map((a) => (
                    <ArtCard key={`rec-${a.id}`} a={a} fav={favs.has(a.id)} onFav={onFav} disabled={pending} showScore />
                  ))}
                </div>
                <Separator className="mt-16 bg-border/40" />
              </section>
            )}
            <section>
              <div className="flex items-end justify-between">
                <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase">All works</p>
                <p className="text-[12px] tabular-nums text-muted-foreground/50">{filtered.length}</p>
              </div>
              {filtered.length === 0 ? (
                <p className="py-32 text-center text-sm text-muted-foreground">No works match. Widen your filters.</p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((a) => (
                    <ArtCard key={a.id} a={a} fav={favs.has(a.id)} onFav={onFav} disabled={pending} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar filters */}
          <aside className="hidden space-y-8 lg:block">
            <FilterSection title="Style" items={allStyles} selected={stylesSel} onToggle={(s) => setStylesSel((p) => toggle(p, s))} />
            <Separator className="bg-border/40" />
            <FilterSection title="Color" items={allColors} selected={colorsSel} onToggle={(c) => setColorsSel((p) => toggle(p, c))} />
            <Separator className="bg-border/40" />
            <FilterSection title="Tier" items={["Basic", "Premium", "Collector"]} selected={tiersSel} onToggle={(t) => setTiersSel((p) => toggle(p, t))} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.15em] text-muted-foreground/60 uppercase">{title}</p>
      <div className="mt-3 flex max-h-44 flex-col gap-2.5 overflow-y-auto">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground hover:text-foreground">
            <Checkbox checked={selected.includes(item)} onCheckedChange={() => onToggle(item)} />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function ArtCard({ a, fav, onFav, disabled, showScore }: { a: DiscoverArtwork; fav: boolean; onFav: (id: string) => void; disabled?: boolean; showScore?: boolean }) {
  const cover = a.imageUrls[0];
  return (
    <div className="group">
      <Link href={`/art/${a.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
          {showScore && a.score > 0 && (
            <span className="absolute top-3 left-3 text-[10px] tracking-wider text-white/80 bg-black/30 px-2 py-0.5 backdrop-blur-sm">
              {a.score}% match
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.12em] text-muted-foreground/60 uppercase">{a.artistName}</p>
          <Link href={`/art/${a.id}`} className="mt-0.5 block text-sm tracking-tight text-foreground hover:underline underline-offset-2">
            {a.title}
          </Link>
          <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/50">{a.width} &times; {a.height} in</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onFav(a.id)}
          aria-pressed={fav}
          aria-label={fav ? "Remove from favorites" : "Save to favorites"}
          className={cn(
            "mt-0.5 shrink-0 text-muted-foreground/40 transition-colors hover:text-foreground",
            fav && "text-foreground"
          )}
        >
          <Heart className={cn("size-4", fav && "fill-current")} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
