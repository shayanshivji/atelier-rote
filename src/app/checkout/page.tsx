import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { ArrowRight, Check, Package } from "lucide-react";

import { auth } from "@/lib/auth";
import { subscribeToPlan } from "@/lib/actions";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AutoRedirectToCollection } from "./auto-redirect";

export const metadata = {
  title: "Checkout | Atelier Rote",
  description: "Complete your Atelier Rote membership.",
};

async function confirmSubscription(formData: FormData) {
  "use server";
  const planId = (formData.get("planId") as string | null)?.trim();
  if (!planId) redirect("/pricing");
  await subscribeToPlan(planId);
  redirect("/checkout?success=1");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLongDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

type SearchParams = Promise<{ plan?: string; success?: string }>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const sp = await searchParams;

  if (sp.success === "1") {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (!sub) {
      redirect("/pricing");
    }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, sub.planId))
      .limit(1);

    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col gap-10 px-6 py-24">
        <div className="flex flex-col items-center text-center">
          <div className="bg-primary/10 text-primary mb-6 flex size-14 items-center justify-center rounded-full">
            <Check className="size-7" strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-foreground mb-2 text-3xl font-light tracking-tight">
            You&apos;re in
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Your membership is active. We&apos;ll prepare your first rotation
            and notify you before delivery.
          </p>
        </div>

        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-medium">
              Subscription summary
            </CardTitle>
            <CardDescription>
              {plan?.name ?? "Current"} plan · billed monthly
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next curated swap</span>
              <span className="text-foreground font-medium">
                {formatLongDate(sub.nextSwapDate)}
              </span>
            </div>
            <Separator />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Swaps can be rescheduled from your collection. Standard lead
              times apply.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/collection"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-10 w-full gap-2 sm:flex-1"
              )}
            >
              View my collection
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 w-full sm:flex-1"
              )}
            >
              Plan details
            </Link>
          </CardFooter>
        </Card>

        <AutoRedirectToCollection />
      </div>
    );
  }

  const planId = sp.plan?.trim();
  if (!planId) {
    redirect("/pricing");
  }

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) {
    redirect("/pricing");
  }

  return (
    <div className="mx-auto grid min-h-full max-w-5xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <Link
          href="/pricing"
          className="text-muted-foreground hover:text-foreground mb-10 inline-flex text-xs tracking-widest uppercase"
        >
          ← Plans
        </Link>
        <h1 className="text-foreground mb-3 text-3xl font-light tracking-tight sm:text-4xl">
          Checkout
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
          Review your membership and confirm. Payment is simulated for this
          preview—no charges are processed.
        </p>

        <Card className="border-foreground/10">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <Package className="text-foreground size-6" strokeWidth={1.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <CardTitle className="font-heading text-xl font-medium tracking-tight">
                  {plan.name}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Monthly
                </Badge>
              </div>
              <CardDescription>
                {plan.piecesMin}{plan.piecesMax ? `\u2013${plan.piecesMax}` : "+"} pieces ·{" "}
                {plan.rotationSchedule} · {plan.insuranceLevel}{" "}
                coverage
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Monthly</span>
              <span className="text-2xl font-light tracking-tight">
                {formatMoney(plan.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground"> / mo</span>
              </span>
            </div>
            {plan.setupFee > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">One-time setup</span>
                <span className="text-base font-light tracking-tight">
                  {formatMoney(plan.setupFee)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-foreground text-sm font-medium">Due today</span>
              <span className="text-2xl font-light tracking-tight">
                {formatMoney(plan.monthlyPrice + plan.setupFee)}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Renews at {formatMoney(plan.monthlyPrice)}/mo. Cancel anytime from account settings (preview).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-foreground/10 h-fit lg:mt-14">
        <CardHeader>
          <CardTitle className="font-heading text-base font-medium">
            Mock payment
          </CardTitle>
          <CardDescription>
            Visual only—submitting confirms your subscription in the demo
            database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={confirmSubscription} className="flex flex-col gap-5">
            <input type="hidden" name="planId" value={plan.id} />
            <div className="grid gap-2">
              <Label htmlFor="card-name">Name on card</Label>
              <Input
                id="card-name"
                name="cardName"
                placeholder="Jordan Lee"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                name="cardNumber"
                placeholder="4242 4242 4242 4242"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" name="exp" placeholder="MM / YY" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" name="cvc" placeholder="123" />
              </div>
            </div>
            <Separator className="my-1" />
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full gap-2 text-sm font-medium"
              )}
            >
              Confirm subscription
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
