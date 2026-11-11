import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LOOKING_FOR, ROLES, bestMatches, fmtLisbon } from "@/lib/event";
import { scrollToId, useCampus, useDirectory, type DirEntry } from "@/lib/campus";
import { Card, Chip, Section } from "./Basics";

function PersonCard({ p }: { p: DirEntry }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{p.full_name}</h3>
          <p className="truncate text-sm text-muted-foreground">{p.company}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-accent">{p.role}</span>
      </div>
      <p className="mt-3 text-sm">{p.one_liner}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.looking_for.map((x) => <span key={x} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{x}</span>)}
      </div>
      <div className="mt-auto pt-4">
        {p.slot_starts_at && <p className="mb-3 text-sm text-accent">On stage at {fmtLisbon(p.slot_starts_at)} Lisbon</p>}
        {p.linkedin_url && (
          <Button asChild variant="soft" className="w-full">
            <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer nofollow">Connect on LinkedIn</a>
          </Button>
        )}
      </div>
    </Card>
  );
}

export function Match() {
  const { data, isLoading } = useDirectory();
  const { me } = useCampus();
  const [roles, setRoles] = useState<string[]>([]);
  const [wants, setWants] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(24);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const all = data ?? [];
  const best = useMemo(() => (me ? bestMatches(me, all, 6) : []), [me, all]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((p) =>
      p.id !== me?.id &&
      (roles.length === 0 || roles.includes(p.role)) &&
      (wants.length === 0 || wants.some((w) => p.looking_for.includes(w))) &&
      (!s || `${p.full_name} ${p.company} ${p.one_liner}`.toLowerCase().includes(s)));
  }, [all, roles, wants, q, me]);

  return (
    <Section id="match" eyebrow="Matchmaking" title="Find who to meet."
      sub="Found someone? Message them on LinkedIn and meet at a Floor1 table or on the Rooftop.">
      {best.length > 0 && (
        <div className="mb-12">
          <h3 className="mb-4 text-xl font-semibold">Best matches for you</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{best.map((p) => <PersonCard key={p.id} p={p} />)}</div>
        </div>
      )}

      <div className="space-y-4">
        <input placeholder="Search name, company, what they do…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(24); }}
          className="w-full rounded-xl border border-input bg-surface px-4 py-3 text-base outline-none focus:border-primary" />
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs uppercase tracking-widest text-muted-foreground">Role</span>
          {ROLES.map((r) => <Chip key={r} active={roles.includes(r)} onClick={() => toggle(roles, setRoles, r)}>{r}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs uppercase tracking-widest text-muted-foreground">Looking for</span>
          {LOOKING_FOR.map((r) => <Chip key={r} active={wants.includes(r)} onClick={() => toggle(wants, setWants, r)}>{r}</Chip>)}
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading the directory…</p>
        ) : all.length === 0 || (all.length === 1 && me && all[0]?.id === me.id) ? (
          <Card className="text-center">
            <p className="text-xl font-semibold">Be the first one in.</p>
            <p className="mt-1 text-muted-foreground">Register and you'll show up here for everyone looking for someone like you.</p>
            {!me && <Button variant="hero" size="xl" className="mt-4" onClick={() => scrollToId("register")}>Register</Button>}
          </Card>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">Nobody matches these filters yet. Try fewer filters.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, limit).map((p) => <PersonCard key={p.id} p={p} />)}</div>
            {filtered.length > limit && (
              <div className="mt-6 text-center"><Button variant="soft" size="xl" onClick={() => setLimit((l) => l + 24)}>Load more</Button></div>
            )}
          </>
        )}
      </div>
    </Section>
  );
}
