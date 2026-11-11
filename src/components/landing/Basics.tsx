import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { scrollToId } from "@/lib/campus";

export function Section({ id, eyebrow, title, children, sub }: { id?: string; eyebrow?: string; title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {sub && <div className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{sub}</div>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-6 ${className}`}>{children}</div>;
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active ? "border-primary bg-primary/15 text-accent" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="text-lg font-bold tracking-[0.4em]">AIXP</a>
        <Button variant="hero" onClick={() => scrollToId("register")}>Book a slot</Button>
      </div>
    </header>
  );
}

export function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 backdrop-blur sm:hidden">
      <div className="flex gap-2">
        <Button variant="hero" size="xl" className="flex-1" onClick={() => scrollToId("register")}>Book my 5 minutes</Button>
        <Button variant="soft" size="xl" onClick={() => scrollToId("match")}>Meet</Button>
      </div>
    </div>
  );
}
