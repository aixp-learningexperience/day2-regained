import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, CAMPUS_URL, LOOKING_FOR, ROLES, registerSchema } from "@/lib/event";
import { scrollToId, useCampus } from "@/lib/campus";
import { Card, Chip, Section } from "./Basics";
import { DeckUpload } from "./Pitch";

const field = "w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary";

export function waShareUrl() {
  const url = typeof window === "undefined" ? SITE_URL : window.location.origin + "/";
  const text = `Web Summit Day 2 is cancelled, so AIXP opened a free virtual campus for the day. 5-minute stage slots + matchmaking. I'm in: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function EnterCampus({ mapTip = false }: { mapTip?: boolean }) {
  return (
    <div>
      <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
        <a href={CAMPUS_URL} target="_blank" rel="noopener noreferrer">Enter the campus</a>
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">No install. Type your name, choose an avatar, walk in. Works best on a laptop.</p>
      {mapTip && <p className="mt-1 text-sm text-muted-foreground">Inside, click the Saratoga logo (top right) to open the 3D map and jump to the Auditorium, Floor1 or the Rooftop.</p>}
    </div>
  );
}

export function Register() {
  const { identity, me, setIdentity, refreshMe } = useCampus();
  const [f, setF] = useState({
    full_name: "", company: "", role: "", email: "", linkedin_url: "", one_liner: "",
    looking_for: [] as string[], show_in_directory: true, consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(f);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const d = parsed.data;
    const { data, error } = await supabase.rpc("register_attendee", {
      p_full_name: d.full_name, p_company: d.company, p_role: d.role, p_email: d.email,
      p_linkedin_url: d.linkedin_url ?? "", p_one_liner: d.one_liner, p_looking_for: d.looking_for,
      p_show_in_directory: d.show_in_directory, p_consent: d.consent,
    });
    setBusy(false);
    const row = (data as { id: string; secret_token: string }[] | null)?.[0];
    if (error || !row) {
      toast.error(error?.message ?? "Something went wrong. Please try again.");
      return;
    }
    setIdentity({ id: row.id, token: row.secret_token });
    refreshMe();
    toast.success("You're in.");
    setTimeout(() => scrollToId("register"), 50);
  }

  if (identity) {
    return (
      <Section id="register" eyebrow="Registration" title="You're in.">
        <Card className="max-w-2xl space-y-6 p-6 sm:p-8">
          {me && <p className="text-lg">Welcome, <b>{me.full_name}</b> from {me.company}.</p>}
          <EnterCampus mapTip />
          <DeckUpload />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="soft" size="xl" onClick={() => scrollToId("slots")}>
              {me?.slot_id ? "See my stage slot" : "Pick my stage slot"}
            </Button>
            <Button asChild variant="soft" size="xl">
              <a href={waShareUrl()} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
            </Button>
          </div>
          <button type="button" className="text-xs text-muted-foreground underline-offset-4 hover:underline" onClick={() => setIdentity(null)}>
            Not you? Register someone else on this device
          </button>
        </Card>
      </Section>
    );
  }

  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-destructive">{errors[k]}</p>;

  return (
    <Section id="register" eyebrow="Register · 30 seconds" title="Get your seat on campus.">
      <Card className="max-w-2xl p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="fn">Full name*</label>
            <input id="fn" className={field} maxLength={100} autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
            {err("full_name")}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="co">Company / project*</label>
            <input id="co" className={field} maxLength={100} autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} />
            {err("company")}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="role">I am a…*</label>
            <select id="role" className={field} value={f.role} onChange={(e) => set("role", e.target.value)}>
              <option value="" disabled>Choose one</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {err("role")}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="em">Work email* <span className="font-normal text-muted-foreground">(private, never shown)</span></label>
            <input id="em" type="email" inputMode="email" autoComplete="email" className={field} maxLength={255} value={f.email} onChange={(e) => set("email", e.target.value)} />
            {err("email")}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="li">LinkedIn URL <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input id="li" type="url" inputMode="url" placeholder="https://www.linkedin.com/in/…" className={field} maxLength={300} value={f.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
            {err("linkedin_url")}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="ol">One-liner: what you do*</label>
            <input id="ol" className={field} maxLength={140} value={f.one_liner} onChange={(e) => set("one_liner", e.target.value)} />
            <p className="mt-1 text-right text-xs text-muted-foreground">{f.one_liner.length}/140</p>
            {err("one_liner")}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">I'm looking for*</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map((x) => (
                <Chip key={x} active={f.looking_for.includes(x)} onClick={() =>
                  set("looking_for", f.looking_for.includes(x) ? f.looking_for.filter((y) => y !== x) : [...f.looking_for, x])}>
                  {x}
                </Chip>
              ))}
            </div>
            {err("looking_for")}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={f.show_in_directory} onChange={(e) => set("show_in_directory", e.target.checked)} />
            Show me in the matchmaking directory
          </label>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
            <span>I agree that AIXP stores these details to run this event and may contact me about it afterwards. My email is never shown publicly.*</span>
          </label>
          {err("consent")}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
            {busy ? "Registering…" : "Register"}
          </Button>
        </form>
      </Card>
    </Section>
  );
}
