import { Button } from "@/components/ui/button";
import { TOTAL_SLOTS, SLOT_MINUTES } from "@/lib/event";
import { scrollToId, useNow, useSlots, useStats } from "@/lib/campus";

export function Hero() {
  const { data: stats } = useStats();
  const { data: slots } = useSlots();
  const now = useNow();
  const live = now
    ? slots?.find((s) => s.taken && new Date(s.starts_at).getTime() <= now && now < new Date(s.starts_at).getTime() + SLOT_MINUTES * 60000)
    : undefined;

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-glow" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pb-24 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent sm:text-sm">
          Wednesday 11 November · 09:00–20:00 Lisbon time · Free
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
          Day 2 is cancelled. <span className="text-gradient">Your pitch isn't.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Storm Charles closed the doors in Lisbon. So for one day AIXP is opening a virtual campus: a free 5-minute slot on the
          auditorium stage, rooms to meet in, and a rooftop to find the people you came for. From wherever you're staying dry.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="hero" size="xl" onClick={() => scrollToId("register")}>Book my 5 minutes</Button>
          <Button variant="soft" size="xl" onClick={() => scrollToId("match")}>Find who to meet</Button>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
            {stats ? (
              <span>
                <b>{stats.registered}</b> {stats.registered === 1 ? "person" : "people"} registered · <b>{stats.slotsLeft}</b> of {TOTAL_SLOTS} stage slots left
              </span>
            ) : (
              <span className="text-muted-foreground">Loading live numbers…</span>
            )}
          </div>
          {live && (
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-4 py-2 text-sm font-medium">
              <span className="font-bold">NOW ON STAGE:</span>
              <span className="truncate">{live.company} — {live.pitch_title}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
