import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SwapBookingForm } from "./swap-form";

export const metadata = {
  title: "Schedule swap | Atelier Rote",
  description: "Book your next art rotation.",
};

export default async function SwapPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const [active] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (!active) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-6 py-24">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-light tracking-tight">
              Subscription required
            </CardTitle>
            <CardDescription>
              Schedule swaps are available to active members. Choose a plan to
              unlock rotations and concierge delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: "lg" }), "h-10 flex-1")}
            >
              View plans
            </Link>
            <Link
              href="/collection"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 flex-1"
              )}
            >
              Collection
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <SwapBookingForm />
    </div>
  );
}
