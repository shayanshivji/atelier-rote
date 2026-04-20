import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, onboardingProfiles, subscriptions, plans } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CancelSubscriptionButton,
  EditNameButton,
  SignOutButton,
} from "@/components/account-client";
import { Settings, User } from "lucide-react";

export const metadata = {
  title: "Account | Atelier Rote",
  description: "Profile, preferences, and membership",
};

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) {
    redirect("/auth");
  }

  const [onboarding] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, user.id))
    .limit(1);

  const [subRow] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const styles = onboarding ? parseJsonArray(onboarding.styles) : [];
  const colors = onboarding ? parseJsonArray(onboarding.colors) : [];

  const status = subRow?.subscription.status ?? null;
  const isActive = status === "active";

  return (
    <div className="min-h-full bg-[#faf9f7] text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Atelier Rote
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight sm:text-4xl">Account</h1>
          <p className="text-sm text-muted-foreground">
            Profile, studio preferences, and your membership.
          </p>
        </header>

        <div className="space-y-8">
          <Card className="border-border/60 bg-white/90 shadow-sm ring-1 ring-black/[0.03]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal">
                  <User className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Profile
                </CardTitle>
                <CardDescription>How we address you and where we send updates.</CardDescription>
              </div>
              <EditNameButton initialName={user.name} />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </p>
                <p className="mt-1">{user.name || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Read-only for your security.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/90 shadow-sm ring-1 ring-black/[0.03]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal">
                  <Settings className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Onboarding preferences
                </CardTitle>
                <CardDescription>What you told us about your space and taste.</CardDescription>
              </div>
              <Link
                href="/onboarding"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit Preferences
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!onboarding ? (
                <p className="text-muted-foreground">
                  You have not completed onboarding yet.{" "}
                  <Link href="/onboarding" className="text-foreground underline underline-offset-4">
                    Start here
                  </Link>
                  .
                </p>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Styles
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {styles.length ? (
                        styles.map((s) => (
                          <Badge key={s} variant="secondary" className="font-normal">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Colors
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {colors.length ? (
                        colors.map((c) => (
                          <Badge key={c} variant="outline" className="font-normal">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Room
                    </dt>
                    <dd className="mt-1">{onboarding.roomType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Wall (cm)
                    </dt>
                    <dd className="mt-1">
                      {onboarding.wallWidth} × {onboarding.wallHeight}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Lighting
                    </dt>
                    <dd className="mt-1">{onboarding.lighting}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Budget tier
                    </dt>
                    <dd className="mt-1">{onboarding.budgetTier}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/90 shadow-sm ring-1 ring-black/[0.03]">
            <CardHeader>
              <CardTitle className="font-serif text-lg font-normal">Subscription</CardTitle>
              <CardDescription>Plan, renewal rhythm, and swaps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!subRow ? (
                <p className="text-muted-foreground">No subscription on file.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{subRow.plan.name}</span>
                    <Badge variant={isActive ? "default" : "secondary"} className="capitalize">
                      {subRow.subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Next swap
                    </p>
                    <p className="mt-1">{formatDate(subRow.subscription.nextSwapDate)}</p>
                  </div>
                  {isActive ? (
                    <CancelSubscriptionButton planName={subRow.plan.name} />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
