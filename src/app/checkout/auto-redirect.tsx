"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRedirectToCollection({ delayMs = 4500 }: { delayMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace("/collection");
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [router, delayMs]);

  return (
    <p className="text-muted-foreground mt-8 text-center text-xs tracking-wide">
      Redirecting to your collection…
    </p>
  );
}
