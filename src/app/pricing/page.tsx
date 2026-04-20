import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Check, ArrowRight, Star } from "lucide-react";

import { db } from "@/lib/db";
import { plans } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Membership | Atelier Rote",
  description: "Residential and commercial art rental plans.",
};

function fmt(v: number) {
  if (v === 0) return "Custom";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function parseFeatures(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const residential = await db.select().from(plans).where(eq(plans.category, "residential")).orderBy(asc(plans.monthlyPrice));
  const commercial = await db.select().from(plans).where(eq(plans.category, "commercial")).orderBy(asc(plans.monthlyPrice));

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
      {/* Header */}
      <div className="mb-20 max-w-lg">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground/60 uppercase">Membership</p>
        <h1 className="mt-4 text-3xl font-light tracking-tight text-foreground lg:text-4xl">
          Plans for every space
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Whether it&apos;s a studio apartment or a multi-zone commercial project, we have a tier designed for you.
        </p>
      </div>

      {/* Residential */}
      <section className="mb-24">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground/50 uppercase">Residential</p>
          <h2 className="mt-2 text-xl font-light tracking-tight text-foreground">For homes and apartments</h2>
        </div>

        <div className="grid gap-px overflow-hidden border border-border/40 lg:grid-cols-3">
          {residential.map((plan, i) => {
            const features = parseFeatures(plan.features);
            const isFeatured = !!plan.featured;
            const isPlus = plan.monthlyPrice === 599;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between bg-background p-8 lg:p-10",
                  i < residential.length - 1 && "border-b border-border/40 lg:border-b-0 lg:border-r"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase">{plan.name}</p>
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.12em] text-foreground/50 uppercase">
                        <Star className="size-3 fill-current" /> Most popular
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-extralight tracking-tight text-foreground">
                    {fmt(plan.monthlyPrice)}{isPlus && "+"}
                    <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                  </p>
                  {plan.setupFee > 0 && (
                    <p className="mt-1 text-[12px] text-muted-foreground/60">
                      +{fmt(plan.setupFee)} one-time setup
                    </p>
                  )}
                  <p className="mt-3 text-[13px] text-muted-foreground">{plan.rotationSchedule}</p>
                  <ul className="mt-8 space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/25" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/checkout?plan=${plan.id}`}
                  className={cn(
                    buttonVariants({ variant: isFeatured ? "default" : "outline" }),
                    "mt-10 h-10 w-full rounded-none text-[13px] font-normal tracking-[0.08em] uppercase"
                  )}
                >
                  {isFeatured ? "Get started" : "Choose plan"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Commercial */}
      <section>
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground/50 uppercase">Commercial</p>
          <h2 className="mt-2 text-xl font-light tracking-tight text-foreground">For offices, salons, cafes, and boutiques</h2>
        </div>

        <div className="grid gap-px overflow-hidden border border-border/40 lg:grid-cols-3">
          {commercial.map((plan, i) => {
            const features = parseFeatures(plan.features);
            const isCustom = plan.monthlyPrice === 0;
            const isFeatured = !!plan.featured;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col justify-between bg-background p-8 lg:p-10",
                  i < commercial.length - 1 && "border-b border-border/40 lg:border-b-0 lg:border-r"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase">{plan.name}</p>
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.12em] text-foreground/50 uppercase">
                        <Star className="size-3 fill-current" /> Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-extralight tracking-tight text-foreground">
                    {isCustom ? "Custom" : fmt(plan.monthlyPrice)}
                    {!isCustom && <span className="text-sm font-normal text-muted-foreground"> / mo</span>}
                  </p>
                  {!isCustom && plan.setupFee > 0 && (
                    <p className="mt-1 text-[12px] text-muted-foreground/60">
                      +{fmt(plan.setupFee)} one-time setup
                    </p>
                  )}
                  <p className="mt-3 text-[13px] text-muted-foreground">{plan.rotationSchedule}</p>
                  <ul className="mt-8 space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/25" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {isCustom ? (
                  <Link
                    href="/contact"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "mt-10 h-10 w-full rounded-none text-[13px] font-normal tracking-[0.08em] uppercase"
                    )}
                  >
                    Contact us
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/checkout?plan=${plan.id}`}
                    className={cn(
                      buttonVariants({ variant: isFeatured ? "default" : "outline" }),
                      "mt-10 h-10 w-full rounded-none text-[13px] font-normal tracking-[0.08em] uppercase"
                    )}
                  >
                    {isFeatured ? "Get started" : "Choose plan"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
