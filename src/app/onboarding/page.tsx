"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { saveOnboarding } from "@/lib/actions";
import { onboardingSchema } from "@/lib/validations";
import { useOnboardingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STYLES = ["Minimal", "Abstract", "Modern", "Classic", "Colorful", "Black & White", "Photography", "Nature", "Bold", "Calm"] as const;

const COLORS: { name: string; bg: string; border?: boolean }[] = [
  { name: "Red", bg: "bg-red-500" },
  { name: "Blue", bg: "bg-blue-500" },
  { name: "Green", bg: "bg-green-600" },
  { name: "Yellow", bg: "bg-yellow-400" },
  { name: "Black", bg: "bg-neutral-900" },
  { name: "White", bg: "bg-white", border: true },
  { name: "Orange", bg: "bg-orange-500" },
  { name: "Purple", bg: "bg-purple-500" },
  { name: "Pink", bg: "bg-pink-400" },
  { name: "Teal", bg: "bg-teal-500" },
  { name: "Gold", bg: "bg-amber-500" },
  { name: "Neutral", bg: "bg-stone-400" },
];

const ROOMS = ["Living room", "Bedroom", "Hallway", "Office"] as const;
const STEPS = ["Style", "Palette", "Room", "Plan"];
const TIERS = [
  { id: "essential", label: "Essential", price: "$149 / mo", setup: "+$199 setup", desc: "2\u20133 pieces. Rotation every 6 months, style consultation included." },
  { id: "signature", label: "Signature", price: "$299 / mo", setup: "+$299 setup", desc: "4\u20136 pieces. Curated per room, rotation every 6 months, buyout credit." },
  { id: "concierge", label: "Concierge", price: "$599+ / mo", setup: "+$500 setup", desc: "7\u201312 pieces. Priority curation, flexible rotations, dedicated advisor." },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const step = useOnboardingStore((s) => s.step);
  const styles = useOnboardingStore((s) => s.styles);
  const colors = useOnboardingStore((s) => s.colors);
  const roomType = useOnboardingStore((s) => s.roomType);
  const wallWidth = useOnboardingStore((s) => s.wallWidth);
  const wallHeight = useOnboardingStore((s) => s.wallHeight);
  const lighting = useOnboardingStore((s) => s.lighting);
  const budgetTier = useOnboardingStore((s) => s.budgetTier);
  const setStep = useOnboardingStore((s) => s.setStep);
  const setStyles = useOnboardingStore((s) => s.setStyles);
  const setColors = useOnboardingStore((s) => s.setColors);
  const setRoom = useOnboardingStore((s) => s.setRoomDetails);
  const setBudget = useOnboardingStore((s) => s.setBudgetTier);

  useEffect(() => {
    getSession().then((s) => { if (!s?.user) router.replace("/auth"); else setReady(true); });
  }, [router]);

  const toggleStyle = useCallback((v: string) => {
    if (styles.includes(v)) setStyles(styles.filter((s) => s !== v));
    else if (styles.length < 5) setStyles([...styles, v]);
  }, [styles, setStyles]);

  const toggleColor = useCallback((v: string) => {
    if (colors.includes(v)) setColors(colors.filter((c) => c !== v));
    else if (colors.length < 4) setColors([...colors, v]);
  }, [colors, setColors]);

  const canNext = useMemo(() => {
    if (step === 0) return styles.length >= 3;
    if (step === 1) return colors.length >= 2;
    if (step === 2) return !!roomType && wallWidth >= 12 && wallHeight >= 12 && !!lighting;
    if (step === 3) return !!budgetTier && confirm;
    return false;
  }, [step, styles.length, colors.length, roomType, wallWidth, wallHeight, lighting, budgetTier, confirm]);

  async function handleFinish() {
    setError(null);
    const parsed = onboardingSchema.safeParse({ styles, colors, roomType, wallWidth, wallHeight, lighting, budgetTier });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your selections."); return; }
    setSubmitting(true);
    try { await saveOnboarding(parsed.data); router.push("/discover"); router.refresh(); }
    catch { setError("Could not save. Try again."); }
    finally { setSubmitting(false); }
  }

  if (!ready) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Preparing\u2026</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16 text-center">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground/60 uppercase">Onboarding</p>
        <h1 className="mt-4 text-2xl font-light tracking-tight text-foreground lg:text-3xl">Shape your walls</h1>
        <p className="mt-3 text-sm text-muted-foreground">A short ritual to tune your recommendations.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-12 flex items-center justify-between border-b border-border/40 pb-4">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => { if (i < step) setStep(i); }}
            className={cn(
              "text-[12px] tracking-[0.1em] uppercase transition-colors",
              i === step ? "text-foreground" : i < step ? "text-muted-foreground cursor-pointer hover:text-foreground" : "text-muted-foreground/40"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-8 text-[13px] text-destructive">{error}</p>}

      {/* Step 0: Styles */}
      {step === 0 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-light tracking-tight">Which moods feel like home?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose 3 to 5 directions.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STYLES.map((s) => {
              const on = styles.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStyle(s)}
                  aria-pressed={on}
                  className={cn(
                    "border px-4 py-3.5 text-left text-[13px] tracking-tight transition-all",
                    on ? "border-foreground bg-foreground text-background" : "border-border/50 text-foreground hover:border-foreground/30"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] tabular-nums text-muted-foreground/60">{styles.length} / 5 selected</p>
        </div>
      )}

      {/* Step 1: Colors */}
      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-light tracking-tight">Which colors anchor your space?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick 2 to 4.</p>
          </div>
          <div className="grid grid-cols-4 gap-6 sm:grid-cols-6">
            {COLORS.map((c) => {
              const on = colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleColor(c.name)}
                  aria-pressed={on}
                  className="group flex flex-col items-center gap-2"
                >
                  <span className={cn(
                    "size-10 rounded-full transition-all sm:size-12",
                    c.bg,
                    c.border && "ring-1 ring-border",
                    on ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "group-hover:ring-1 group-hover:ring-foreground/20"
                  )} />
                  <span className="text-[11px] text-muted-foreground">{c.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[12px] tabular-nums text-muted-foreground/60">{colors.length} / 4 selected</p>
        </div>
      )}

      {/* Step 2: Room */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-light tracking-tight">Tell us about the wall</h2>
            <p className="mt-1 text-sm text-muted-foreground">Dimensions and light change how a piece reads.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] text-muted-foreground">Room type</Label>
            <Select value={roomType || undefined} onValueChange={(v) => setRoom({ roomType: v ?? "", wallWidth, wallHeight, lighting })}>
              <SelectTrigger className="h-10 w-full max-w-none rounded-none border-border/50 bg-transparent text-sm">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>{ROOMS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">Wall width (in)</Label>
              <Input type="number" min={12} value={wallWidth || ""} onChange={(e) => setRoom({ roomType, wallWidth: +e.target.value || wallWidth, wallHeight, lighting })} className="h-10 rounded-none border-border/50 bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">Wall height (in)</Label>
              <Input type="number" min={12} value={wallHeight || ""} onChange={(e) => setRoom({ roomType, wallWidth, wallHeight: +e.target.value || wallHeight, lighting })} className="h-10 rounded-none border-border/50 bg-transparent" />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-[13px] text-muted-foreground">Lighting</Label>
            <RadioGroup value={lighting} onValueChange={(v) => setRoom({ roomType, wallWidth, wallHeight, lighting: v })} className="flex gap-4">
              {["Bright", "Medium", "Low"].map((opt) => (
                <label key={opt} className={cn(
                  "flex cursor-pointer items-center gap-2.5 border px-4 py-3 text-[13px] transition-all",
                  lighting === opt ? "border-foreground" : "border-border/50 hover:border-foreground/30"
                )}>
                  <RadioGroupItem value={opt} />
                  {opt}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Step 3: Budget */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-light tracking-tight">Choose your tier</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select the cadence that suits your space.</p>
          </div>
          <div className="grid gap-px overflow-hidden border border-border/40 sm:grid-cols-3">
            {TIERS.map((t, i) => {
              const on = budgetTier === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBudget(t.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col p-6 text-left transition-colors",
                    on ? "bg-foreground text-background" : "bg-background hover:bg-muted/30",
                    i < TIERS.length - 1 && "border-b border-border/40 sm:border-b-0 sm:border-r"
                  )}
                >
                  <span className="text-[11px] tracking-[0.15em] uppercase opacity-60">{t.label}</span>
                  <span className="mt-2 text-xl font-extralight tracking-tight">{t.price}</span>
                  <span className={cn("mt-1 text-[11px]", on ? "opacity-50" : "text-muted-foreground/60")}>{t.setup}</span>
                  <span className={cn("mt-3 text-[13px] leading-relaxed", on ? "opacity-70" : "text-muted-foreground")}>{t.desc}</span>
                </button>
              );
            })}
          </div>
          <label className="flex items-start gap-3 text-[13px] text-muted-foreground">
            <Checkbox checked={confirm} onCheckedChange={(c) => setConfirm(!!c)} className="mt-0.5" />
            I confirm these preferences reflect how I want Atelier Rote to curate for this space.
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-14 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || submitting}
          className="h-10 rounded-none px-6 text-[13px] tracking-[0.08em] uppercase"
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="h-10 rounded-none px-8 text-[13px] tracking-[0.08em] uppercase"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!canNext || submitting}
            className="h-10 rounded-none px-8 text-[13px] tracking-[0.08em] uppercase"
          >
            {submitting ? "Saving\u2026" : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
