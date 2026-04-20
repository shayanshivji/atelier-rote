import Image from "next/image";
import Link from "next/link";
import { asc, eq, sql, and } from "drizzle-orm";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { artists, artworks, plans } from "@/lib/schema";

function pickImage(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed[0] as string) ?? null : null;
  } catch {
    return null;
  }
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function Home() {
  const showcase = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      tier: artworks.tier,
      imageUrls: artworks.imageUrls,
      artistName: artists.name,
    })
    .from(artworks)
    .innerJoin(artists, eq(artworks.artistId, artists.id))
    .where(eq(artworks.available, true))
    .orderBy(sql`random()`)
    .limit(6);

  const residentialPlans = await db.select().from(plans)
    .where(eq(plans.category, "residential"))
    .orderBy(asc(plans.monthlyPrice));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate flex min-h-[92vh] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://picsum.photos/seed/atelierhero/2400/1600"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 pb-28 pt-40 lg:px-8 lg:pb-36">
          <div className="max-w-xl space-y-10">
            <p className="text-[11px] font-normal tracking-[0.35em] text-foreground/50 uppercase">
              Seasonal art rental
            </p>
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-light leading-[1.08] tracking-tight text-foreground">
              A gallery that rotates with&nbsp;the&nbsp;seasons.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Curated artwork delivered to your door, refreshed when the light changes.
            </p>
            <div className="flex items-center gap-5 pt-2">
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-none px-8 text-[13px] font-normal tracking-[0.12em] uppercase"
                )}
              >
                Get started
                <ArrowRight className="ml-2 size-3.5" />
              </Link>
              <Link
                href="/discover"
                className="text-[13px] tracking-[0.06em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Browse collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 max-w-md">
            <p className="text-[11px] font-normal tracking-[0.3em] text-muted-foreground/70 uppercase">
              In rotation
            </p>
            <h2 className="mt-4 text-3xl font-light tracking-tight text-foreground lg:text-4xl">
              Currently available
            </h2>
          </div>

          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((art) => {
              const src = pickImage(art.imageUrls);
              return (
                <Link key={art.id} href={`/art/${art.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted/40">
                    {src && (
                      <Image
                        src={src}
                        alt={art.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-[11px] tracking-[0.15em] text-muted-foreground/70 uppercase">
                      {art.artistName}
                    </p>
                    <p className="text-sm font-normal tracking-tight text-foreground">
                      {art.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/40 py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-20 lg:grid-cols-2 lg:gap-24">
            <div className="relative aspect-[4/5] max-h-[36rem] overflow-hidden bg-muted/30 lg:max-h-none">
              <Image
                src="https://picsum.photos/seed/atelierprocess/1200/1500"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-normal tracking-[0.3em] text-muted-foreground/70 uppercase">
                The process
              </p>
              <h2 className="mt-4 text-3xl font-light tracking-tight text-foreground lg:text-4xl">
                How it works
              </h2>
              <div className="mt-14 space-y-12">
                {[
                  { num: "01", title: "Tell us your style", desc: "A short quiz about your taste, palette, and the room that will hold the work." },
                  { num: "02", title: "Receive curated art", desc: "Framed originals and limited editions arrive insured, ready to hang." },
                  { num: "03", title: "Swap with the seasons", desc: "When your walls need a new chapter, schedule a swap. Keep what you love." },
                ].map(({ num, title, desc }) => (
                  <div key={num} className="flex gap-8">
                    <span className="mt-0.5 text-[13px] tabular-nums text-muted-foreground/50">
                      {num}
                    </span>
                    <div>
                      <h3 className="text-base font-normal tracking-tight text-foreground">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <p className="text-[11px] font-normal tracking-[0.3em] text-muted-foreground/70 uppercase">
                Membership
              </p>
              <h2 className="mt-4 text-3xl font-light tracking-tight text-foreground lg:text-4xl">
                Plans for every space
              </h2>
            </div>
            <Link
              href="/pricing"
              className="text-[13px] tracking-[0.06em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              View all plans including commercial
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden border border-border/50 lg:grid-cols-3">
            {residentialPlans.map((plan, i) => {
              const isFeatured = !!plan.featured;
              const isPlus = plan.monthlyPrice === 599;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col justify-between bg-background p-10 lg:p-12",
                    i < residentialPlans.length - 1 && "border-b border-border/50 lg:border-b-0 lg:border-r"
                  )}
                >
                  <div>
                    <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase">{plan.name}</p>
                    <p className="mt-3 text-3xl font-extralight tracking-tight text-foreground">
                      {currency.format(plan.monthlyPrice)}{isPlus && "+"}
                      <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                    </p>
                    {plan.setupFee > 0 && (
                      <p className="mt-1 text-[12px] text-muted-foreground/50">
                        +{currency.format(plan.setupFee)} setup
                      </p>
                    )}
                    <p className="mt-2 text-[13px] text-muted-foreground">{plan.rotationSchedule}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {plan.piecesMin}{plan.piecesMax ? `\u2013${plan.piecesMax}` : "+"} pieces
                    </p>
                  </div>
                  <Link
                    href="/onboarding"
                    className={cn(
                      buttonVariants({ variant: isFeatured ? "default" : "outline" }),
                      "mt-10 h-10 w-full rounded-none text-[13px] font-normal tracking-[0.1em] uppercase"
                    )}
                  >
                    Get started
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
