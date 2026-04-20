"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Crown, Truck } from "lucide-react";

import { scheduleSwap } from "@/lib/actions";
import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

function formatSlot(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function localDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function SwapBookingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const minDate = useMemo(() => addDays(new Date(), 1), []);
  const [date, setDate] = useState(() => localDateInputValue(minDate));
  const [time, setTime] = useState<string>(TIME_SLOTS[1]);
  const [deliveryType, setDeliveryType] = useState<"Standard" | "White-Glove">(
    "Standard"
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await scheduleSwap({
        scheduledDate: date,
        scheduledTime: time,
        deliveryType,
      });
      if (result && "success" in result && result.success) {
        setDone(true);
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <Card className="border-foreground/10 mx-auto max-w-lg">
        <CardHeader className="items-center text-center">
          <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-full">
            <Check className="size-7" strokeWidth={1.5} aria-hidden />
          </div>
          <CardTitle className="font-heading text-2xl font-light tracking-tight">
            Swap scheduled
          </CardTitle>
          <CardDescription className="text-base">
            Our logistics team will confirm your window and send pickup details
            shortly.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/collection")}
          >
            Back to collection
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
          <Crown className="size-3.5" aria-hidden />
          Concierge logistics
        </div>
        <h1 className="text-foreground mb-2 text-3xl font-light tracking-tight sm:text-4xl">
          Schedule a swap
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Choose a date, arrival window, and how you&apos;d like pieces moved.
          We&apos;ll coordinate packing, transit, and installation to match your
          space.
        </p>
      </div>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle className="font-heading text-base font-medium">
            Date & time
          </CardTitle>
          <CardDescription>
            Select a preferred day and two-hour-style slot (demo times).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="swap-date" className="flex items-center gap-2">
              <Calendar className="size-3.5" aria-hidden />
              Date
            </Label>
            <Input
              id="swap-date"
              type="date"
              min={localDateInputValue(minDate)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Time slot</Label>
            <Select
              value={time}
              onValueChange={(v) => {
                if (v) setTime(v);
              }}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {formatSlot(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle className="font-heading text-base font-medium">
            Delivery preference
          </CardTitle>
          <CardDescription>
            White-glove includes uncrating, placement, and light styling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={deliveryType}
            onValueChange={(v) =>
              setDeliveryType(v as "Standard" | "White-Glove")
            }
            className="grid gap-4 md:grid-cols-2"
          >
            <label
              htmlFor="delivery-standard"
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                deliveryType === "Standard"
                  ? "border-primary ring-primary/15 ring-2"
                  : "border-border hover:border-foreground/20"
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="Standard" id="delivery-standard" />
                <span className="text-foreground text-sm font-medium">
                  Standard
                </span>
                <Truck className="text-muted-foreground ml-auto size-4" />
              </div>
              <p className="text-muted-foreground pl-7 text-xs leading-relaxed">
                Threshold delivery in protective crates. Best for flexible
                install timing and smaller works.
              </p>
            </label>
            <label
              htmlFor="delivery-white"
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                deliveryType === "White-Glove"
                  ? "border-primary ring-primary/15 ring-2"
                  : "border-border hover:border-foreground/20"
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="White-Glove" id="delivery-white" />
                <span className="text-foreground text-sm font-medium">
                  White-glove
                </span>
                <Truck className="text-muted-foreground ml-auto size-4" />
              </div>
              <p className="text-muted-foreground pl-7 text-xs leading-relaxed">
                Full-service handling: uncrating, wall placement, debris removal,
                and a final walkthrough with your curator.
              </p>
            </label>
          </RadioGroup>
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/collection")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full gap-2 sm:w-auto"
            disabled={pending}
          >
            {pending ? "Confirming…" : "Confirm schedule"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
