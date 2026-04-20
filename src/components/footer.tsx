import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-6 h-px bg-border/50 lg:mx-8" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 lg:px-8">
        <p className="text-[12px] tracking-[0.15em] text-muted-foreground/70 uppercase">
          &copy; {new Date().getFullYear()} Atelier Rote
        </p>
        <nav className="flex gap-6">
          {["Privacy", "Terms"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase()}`}
              className="text-[12px] tracking-[0.08em] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
