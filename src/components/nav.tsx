"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/collection", label: "Collection" },
  { href: "/favorites", label: "Favorites" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 sm:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-4" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 border-r-0 bg-background">
              <SheetHeader>
                <SheetTitle className="text-sm font-normal tracking-[0.2em] uppercase">
                  Atelier Rote
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-12 flex flex-col gap-6">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "text-sm tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground",
                      (pathname === href || pathname.startsWith(`${href}/`)) && "text-foreground"
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="text-[13px] font-normal tracking-[0.22em] text-foreground uppercase"
          >
            Atelier Rote
          </Link>
        </div>

        <nav className="hidden items-center gap-8 sm:flex">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[13px] tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center">
          {status === "loading" ? (
            <div className="size-7" />
          ) : status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Account"
                  >
                    <UserRound className="size-[18px]" strokeWidth={1.5} />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-44 border-border/60">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth"
              className="text-[13px] tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <div className="mx-6 h-px bg-border/60 lg:mx-8" />
    </header>
  );
}
