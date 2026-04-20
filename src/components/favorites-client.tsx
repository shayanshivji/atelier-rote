"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Heart,
  Trash2,
  Plus,
  FolderPlus,
} from "lucide-react";

import type { BoardRow, FavoriteRow } from "@/app/favorites/page";
import {
  toggleFavorite,
  createBoard,
  moveFavoriteToBoard,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type Props = {
  initialFavorites: FavoriteRow[];
  initialBoards: BoardRow[];
};

function sortBoards(rows: BoardRow[]): BoardRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

export function FavoritesClient({ initialFavorites, initialBoards }: Props) {
  const router = useRouter();
  const [favorites, setFavorites] = React.useState(initialFavorites);
  const [boards, setBoards] = React.useState(() => sortBoards(initialBoards));
  const [filter, setFilter] = React.useState<string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newBoardName, setNewBoardName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    setFavorites(initialFavorites);
  }, [initialFavorites]);

  React.useEffect(() => {
    setBoards(sortBoards(initialBoards));
  }, [initialBoards]);

  const unassignedCount = React.useMemo(
    () => favorites.filter((f) => f.boardId == null).length,
    [favorites],
  );

  const filtered = React.useMemo(() => {
    if (filter === "all") return favorites;
    if (filter === "unassigned") {
      return favorites.filter((f) => f.boardId == null);
    }
    return favorites.filter((f) => f.boardId === filter);
  }, [favorites, filter]);

  async function handleRemove(artworkId: string) {
    try {
      await toggleFavorite(artworkId);
      setFavorites((prev) => prev.filter((f) => f.artworkId !== artworkId));
      toast.success("Removed from moodboard");
      router.refresh();
    } catch {
      toast.error("Could not update favorites");
    }
  }

  async function handleBoardChange(favoriteId: string, value: string | null) {
    const boardId = value === "__none__" ? null : value;
    try {
      await moveFavoriteToBoard(favoriteId, boardId);
      setFavorites((prev) =>
        prev.map((f) =>
          f.favoriteId === favoriteId ? { ...f, boardId } : f,
        ),
      );
      toast.success(boardId ? "Moved to board" : "Removed from board");
      router.refresh();
    } catch {
      toast.error("Could not move piece");
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    const name = newBoardName.trim();
    if (!name) {
      toast.error("Enter a board name");
      return;
    }
    setCreating(true);
    try {
      const res = await createBoard(name);
      if (!res.success || !("id" in res) || !res.id) {
        toast.error("Could not create board");
        return;
      }
      setBoards((prev) => sortBoards([...prev, { id: res.id as string, name }]));
      setNewBoardName("");
      setCreateOpen(false);
      toast.success("Board created");
      router.refresh();
    } catch {
      toast.error("Could not create board");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="min-w-0 flex-1 gap-3">
          <TabsList
            variant="line"
            className="h-auto w-full max-w-full flex-wrap justify-start gap-1 bg-transparent p-0"
          >
            <TabsTrigger value="all" className="rounded-full px-3 py-1.5 text-xs sm:text-sm">
              All
              <Badge variant="secondary" className="ml-1.5 font-normal tabular-nums">
                {favorites.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="unassigned"
              className="rounded-full px-3 py-1.5 text-xs sm:text-sm"
            >
              Unassigned
              <Badge variant="secondary" className="ml-1.5 font-normal tabular-nums">
                {unassignedCount}
              </Badge>
            </TabsTrigger>
            {boards.map((b) => (
              <TabsTrigger
                key={b.id}
                value={b.id}
                className="rounded-full px-3 py-1.5 text-xs sm:text-sm"
              >
                {b.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="shrink-0 gap-1.5" />}>
            <FolderPlus className="size-4" />
            Create board
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateBoard}>
              <DialogHeader>
                <DialogTitle>New board</DialogTitle>
                <DialogDescription>
                  Name a collection—season, palette, or a show you are planning.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <Label htmlFor="board-name">Board name</Label>
                <Input
                  id="board-name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Spring salon, Moody autumn…"
                  autoComplete="off"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-1.5">
                  <Plus className="size-4" />
                  {creating ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-border/60" />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-white/60 py-24 text-center">
          <Heart className="mb-3 size-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Save pieces from the gallery to see them on your moodboard, then sort them into boards.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>div]:mb-4">
          {filtered.map((item, index) => (
            <MoodboardCard
              key={item.favoriteId}
              item={item}
              boards={boards}
              onRemove={() => handleRemove(item.artworkId)}
              onBoardChange={(value) => handleBoardChange(item.favoriteId, value)}
              tall={index % 5 === 0 || index % 7 === 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MoodboardCard({
  item,
  boards,
  onRemove,
  onBoardChange,
  tall,
}: {
  item: FavoriteRow;
  boards: BoardRow[];
  onRemove: () => void;
  onBoardChange: (value: string | null) => void;
  tall: boolean;
}) {
  const selectValue = item.boardId ?? "__none__";

  return (
    <Card className="break-inside-avoid overflow-hidden border-border/60 bg-white/90 shadow-sm ring-1 ring-black/[0.03]">
      <CardContent className="p-0">
        <div
          className={
            tall
              ? "relative aspect-[3/5] w-full bg-muted/40"
              : "relative aspect-[4/5] w-full bg-muted/40"
          }
        >
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="line-clamp-2 font-serif text-base leading-snug">{item.title}</p>
            <p className="mt-0.5 text-xs font-normal text-white/80">{item.artistName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectValue} onValueChange={onBoardChange}>
            <SelectTrigger className="h-8 w-full border-border/70 bg-background/80 text-xs sm:max-w-[200px]">
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Unassigned</SelectItem>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-muted-foreground",
                )}
              >
                <span className="sr-only">More</span>
                <span className="text-lg leading-none" aria-hidden>
                  ⋯
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Board</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {boards.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => onBoardChange(b.id)}
                  >
                    Move to {b.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBoardChange("__none__")}>
                  Clear board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove from favorites</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
