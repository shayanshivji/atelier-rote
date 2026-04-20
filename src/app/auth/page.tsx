"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signUp } from "@/lib/actions";
import { signInSchema, signUpSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [name, setName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  function clearErrors() {
    setFormError(null);
    setFieldErrors({});
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    const parsed = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl: "/discover",
      });
      if (!res || (typeof res === "object" && "error" in res && res.error)) {
        setFormError("Invalid email or password.");
        return;
      }
      if (typeof res === "object" && "ok" in res && res.ok) {
        router.push("/discover");
        router.refresh();
        return;
      }
      setFormError("Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    const parsed = signUpSchema.safeParse({ name, email: signUpEmail, password: signUpPassword });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setPending(true);
    try {
      const created = await signUp(parsed.data);
      if ("error" in created && created.error) {
        setFormError(created.error);
        return;
      }
      const res = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (typeof res === "object" && "ok" in res && res.ok) {
        router.push("/discover");
        router.refresh();
        return;
      }
      setFormError("Account created. Sign in manually.");
      setMode("signin");
      setSignInEmail(parsed.data.email);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Atelier Rote
          </p>
          <h1 className="mt-4 text-2xl font-light tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </h1>
        </div>

        <div className="mb-8 flex border-b border-border/50">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); clearErrors(); }}
              className={cn(
                "flex-1 pb-3 text-[13px] tracking-[0.06em] transition-colors",
                mode === m
                  ? "border-b border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {formError && (
          <p role="alert" className="mb-6 text-[13px] text-destructive">
            {formError}
          </p>
        )}

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="si-email" className="text-[13px] font-normal text-muted-foreground">Email</Label>
              <Input
                id="si-email"
                type="email"
                autoComplete="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="h-10 rounded-none border-border/60 bg-transparent"
                placeholder="you@example.com"
              />
              {fieldErrors.email?.[0] && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-pw" className="text-[13px] font-normal text-muted-foreground">Password</Label>
              <Input
                id="si-pw"
                type="password"
                autoComplete="current-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="h-10 rounded-none border-border/60 bg-transparent"
              />
              {fieldErrors.password?.[0] && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-none text-[13px] font-normal tracking-[0.1em] uppercase"
            >
              {pending ? "Signing in\u2026" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="su-name" className="text-[13px] font-normal text-muted-foreground">Name</Label>
              <Input
                id="su-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-none border-border/60 bg-transparent"
              />
              {fieldErrors.name?.[0] && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-email" className="text-[13px] font-normal text-muted-foreground">Email</Label>
              <Input
                id="su-email"
                type="email"
                autoComplete="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="h-10 rounded-none border-border/60 bg-transparent"
              />
              {fieldErrors.email?.[0] && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-pw" className="text-[13px] font-normal text-muted-foreground">Password</Label>
              <Input
                id="su-pw"
                type="password"
                autoComplete="new-password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="h-10 rounded-none border-border/60 bg-transparent"
                placeholder="At least 6 characters"
              />
              {fieldErrors.password?.[0] && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-none text-[13px] font-normal tracking-[0.1em] uppercase"
            >
              {pending ? "Creating\u2026" : "Create account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
