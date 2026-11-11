import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { buildIcs, fmtLisbon, fmtLocal, pitchSchema } from "@/lib/event";
import { scrollToId, useCampus, useNow, useSlots, type Slot } from "@/lib/campus";
import { Card, Section } from "./Basics";
import { EnterCampus } from "./Register";
import { DeckLink, DeckUpload, LikeButton } from "./Pitch";

function downloadIcs(start: string, title: string) {
  const blob = new Blob([buildIcs(start, title)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "aixp-pitch.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Slots() {
  const { data: slots, isLoading } = useSlots();
  const { identity, me, refreshMe } = useCampus();
  const now = useNow();
  const [pick, setPick] = useState<Slot | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const g = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const h = fmtLisbon(s.starts_at).slice(0, 2) + ":00";
      if (!g.has(h)) g.set(h, []);
      g.get(h)!.push(s);
    }
    return [...g.entries()];
  }, [slots]);

  const isPast = (s: Slot) => now !== null && new Date(s.starts_at).getTime() <= now;
  const freeLeft = (slots ?? []).filter((s) => !s.taken && !isPast(s)).length;
  const firstOpenHour = groups.find(([, list]) => list.some((s) => !isPast(s)))?.[0];

  function onSlot(s: Slot) {
    if (!identity) { toast("Register first — it takes 30 seconds."); scrollToId("register"); return; }
    if (me?.slot_id) { toast("You already have a slot. Release it first to pick another."); return; }
    setTitle(""); setPick(s);
  }

  async function confirm() {
    if (!pick || !identity) return;
    const t = pitchSchema.safeParse(title);
    if (!t.success) { toast.error(t.error.issues[0]?.message ?? "Invalid title"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("book_slot", { p_attendee_id: identity.id, p_token: identity.token, p_slot_id: pick.id, p_pitch_title: t.data });
    setBusy(false);
    if (error) { toast.error(error.message); refreshMe(); return; }
    setPick(null); refreshMe(); toast.success("You're on stage!");
  }

  async function release() {
    if (!identity) return;
    const { error } = await supabase.rpc("release_slot", { p_attendee_id: identity.id, p_token: identity.token });
    if (error) toast.error(error.message); else { toast("Slot released. Pick another one."); refreshMe(); }
  }

  async function waitlist() {
    if (!identity) { scrollToId("register"); return; }
    const { error } = await supabase.rpc("join_waitlist", { p_attendee_id: identity.id, p_token: identity.token });
    if (error) toast.error(error.message); else { toast.success("You're on the waitlist."); refreshMe(); }
  }

  return (
    <Section id="slots" eyebrow="Stage schedule" title="132 slots. 5 minutes each."
      sub="Times in Lisbon time, with your local time below. 4 minutes to pitch, 1 minute for questions.">
      {me?.slot_starts_at && (
        <Card className="mb-8 border-primary/40 p-6 sm:p-8">
          <p className="text-xl font-semibold sm:text-2xl">
            You're on stage at <span className="text-gradient">{fmtLisbon(me.slot_starts_at)}</span> Lisbon time.
          </p>
          <p className="mt-2 text-muted-foreground">“{me.pitch_title}” · Be in the Auditorium 10 minutes early (Saratoga logo, top right → 3D map → Auditorium). 4 minutes to pitch, 1 minute for questions.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <Button variant="soft" size="xl" onClick={() => downloadIcs(me.slot_starts_at!, me.pitch_title ?? "")}>Add to calendar</Button>
            {now !== null && new Date(me.slot_starts_at).getTime() > now && (
              <Button variant="ghost" size="xl" onClick={release}>Release my slot</Button>
            )}
          </div>
          <div className="mt-6"><DeckUpload /></div>
          <div className="mt-6"><EnterCampus /></div>
        </Card>
      )}

      {!isLoading && freeLeft === 0 && !me?.slot_id && (
        <Card className="mb-8">
          <p className="text-lg font-semibold">All stage slots are taken.</p>
          {me?.waitlisted ? (
            <p className="mt-2 text-muted-foreground">You're on the waitlist. We'll reach out if a slot opens up — keep an eye on this page too.</p>
          ) : (
            <Button variant="hero" size="xl" className="mt-4" onClick={waitlist}>Join the waitlist</Button>
          )}
        </Card>
      )}

      {isLoading && <p className="text-muted-foreground">Loading the schedule…</p>}

      <div className="space-y-3">
        {groups.map(([hour, list]) => {
          const free = list.filter((s) => !s.taken && !isPast(s)).length;
          const isOpen = open[hour] ?? hour === firstOpenHour;
          return (
            <div key={hour} className="rounded-2xl border border-border bg-surface">
              <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen((o) => ({ ...o, [hour]: !isOpen }))} aria-expanded={isOpen}>
                <span className="text-lg font-semibold">{hour}</span>
                <span className="flex items-center gap-3 text-sm text-muted-foreground">
                  {free} free <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((s) => {
                    const past = isPast(s);
                    const mine = me?.slot_id === s.id;
                    if (s.taken) {
                      return (
                        <div key={s.id} className={`rounded-xl border p-3 text-sm ${mine ? "border-accent bg-primary/15" : "border-border bg-background"} ${past ? "opacity-40" : ""}`}>
                          <p className="font-semibold">{fmtLisbon(s.starts_at)} {mine && <span className="text-accent">· you</span>}</p>
                          <p className="truncate">{s.company}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.pitch_title}</p>
                          {s.attendee_id && (
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <LikeButton targetId={s.attendee_id} likes={s.likes} />
                              <DeckLink url={s.deck_url} />
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <button key={s.id} type="button" disabled={past} onClick={() => onSlot(s)}
                        className="rounded-xl border border-primary/60 p-3 text-left text-sm transition-colors hover:bg-primary/15 disabled:border-border disabled:opacity-35">
                        <p className="font-semibold">{fmtLisbon(s.starts_at)}</p>
                        <p className="text-xs text-muted-foreground">{fmtLocal(s.starts_at)} your time</p>
                        <p className="mt-1 text-xs text-accent">{past ? "Past" : "Free"}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!pick} onOpenChange={(o) => !o && setPick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {pick && fmtLisbon(pick.starts_at)} Lisbon time</DialogTitle>
            <DialogDescription>{pick && `${fmtLocal(pick.starts_at)} your time · `}5 minutes on the Auditorium stage.</DialogDescription>
          </DialogHeader>
          <label className="text-sm font-medium" htmlFor="pt">Pitch title</label>
          <input id="pt" autoFocus maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary" />
          <p className="text-right text-xs text-muted-foreground">{title.length}/80</p>
          <DialogFooter>
            <Button variant="hero" size="xl" onClick={confirm} disabled={busy}>{busy ? "Booking…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
