"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Edit, LogOut } from "lucide-react";

import { updateProfile, cancelSubscription } from "@/lib/actions";
import { Button } from "@/components/ui/button";
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

type EditNameProps = {
  initialName: string | null;
};

export function EditNameButton({ initialName }: EditNameProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(initialName ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setName(initialName ?? "");
  }, [initialName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      toast.success("Profile updated");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Edit className="size-3.5" />
        Edit name
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit display name</DialogTitle>
            <DialogDescription>This is how you appear across Atelier Rote.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="acct-name">Name</Label>
            <Input
              id="acct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CancelSubProps = {
  planName: string;
};

export function CancelSubscriptionButton({ planName }: CancelSubProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onConfirm() {
    setLoading(true);
    try {
      await cancelSubscription();
      toast.success("Subscription canceled");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not cancel subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-destructive" />}>
        Cancel subscription
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {planName}?</DialogTitle>
          <DialogDescription>
            You will keep access until the end of the current period. You can resubscribe anytime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Keep plan
          </Button>
          <Button type="button" variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading ? "Canceling…" : "Yes, cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutButton() {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await signOut({ callbackUrl: "/auth" });
        } catch {
          toast.error("Could not sign out");
          setPending(false);
        }
      }}
    >
      <LogOut className="size-3.5" />
      Sign out
    </Button>
  );
}
