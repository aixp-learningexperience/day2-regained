import { useRef, useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtLisbon } from "@/lib/event";
import { scrollToId, useCampus, useSlots, type DirEntry, type Me, type Slot } from "@/lib/campus";
import { Card, Section } from "./Basics";

const MAX = 5 * 1024 * 1024;

/** Opens a deck. Tries a signed link (works whether the bucket is public or private), falls back to the public URL. */
async function openDeck(url: string) {
  const w = window.open("", "_blank");
  if (w) w.opener = null;
  const path = url.split("/decks/")[1];
  let href = url;
  if (path) {
    const { data } = await supabase.storage.from("decks").createSignedUrl(decodeURIComponent(path), 3600);
    if (data?.signedUrl) href = data.signedUrl;
  }
  if (w) w.location.href = href; else window.open(href, "_blank", "noopener");
}

export function DeckLink({ url, className = "" }: { url: string | null; className?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDeck(url); }}
      className={`text-xs font-medium text-accent underline-offset-4 hover:underline ${className}`}>View deck</a>
  );
}

export function LikeButton({ targetId, likes }: { targetId: string; likes: number }) {
  const { identity, me, refreshMe } = useCampus();
  const qc = useQueryClient();
  const liked = !!me?.liked_ids?.includes(targetId);
  const own = me?.id === targetId;

  async function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!identity) { toast("Register to vote — it takes 30 seconds."); scrollToId("register"); return; }
    if (own) { toast("You can't like your own pitch."); return; }
    const d = liked ? -1 : 1;
    qc.setQueryData<Slot[]>(["slots"], (l) => l?.map((s) => s.attendee_id === targetId ? { ...s, likes: s.likes + d } : s));
    qc.setQueryData<DirEntry[]>(["directory"], (l) => l?.map((p) => p.id === targetId ? { ...p, likes: p.likes + d } : p));
    qc.setQueryData<Me | null>(["me", identity.id], (m) => m && ({ ...m, liked_ids: liked ? m.liked_ids.filter((x) => x !== targetId) : [...m.liked_ids, targetId] }));
    const { error } = await supabase.rpc("toggle_like", { p_attendee_id: identity.id, p_token: identity.token, p_target_id: targetId });
    if (error) toast.error(error.message);
    refreshMe();
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={liked} aria-label={liked ? "Remove like" : "Like this pitch"}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs transition-colors hover:border-primary">
      <Heart className={`h-3.5 w-3.5 ${liked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
      <span>{likes}</span>
    </button>
  );
}

export function TopPitches() {
  const { data } = useSlots();
  const top = (data ?? []).filter((s) => s.attendee_id && s.likes > 0)
    .sort((a, b) => b.likes - a.likes || a.starts_at.localeCompare(b.starts_at)).slice(0, 10);
  return (
    <Section id="top-pitches" eyebrow="Vote" title="Like the pitches you'd back."
      sub="One like per person per pitch. The most-liked pitch at 20:00 Lisbon time is the pitch of the day.">
      {top.length === 0 ? (
        <Card className="text-center"><p className="text-lg font-semibold">No votes yet. Be the first to like a pitch.</p></Card>
      ) : (
        <ol className="space-y-3">
          {top.map((s, i) => (
            <li key={s.id}>
              <Card className="flex items-center gap-4 p-4 sm:p-5">
                <span className="w-6 shrink-0 text-xl font-bold text-gradient">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.company}</p>
                  <p className="truncate text-sm text-muted-foreground">{s.pitch_title}</p>
                  <p className="text-xs text-muted-foreground">{fmtLisbon(s.starts_at)} Lisbon <DeckLink url={s.deck_url} className="ml-2" /></p>
                </div>
                <LikeButton targetId={s.attendee_id!} likes={s.likes} />
              </Card>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

export function DeckUpload() {
  const { identity, me, refreshMe } = useCampus();
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  if (!identity || !me) return null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !identity) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { toast.error("PDF only"); return; }
    if (f.size > MAX) { toast.error("Max 5 MB"); return; }
    setBusy("Uploading…");
    try {
      const { data: path, error } = await supabase.rpc("request_deck_upload", { p_attendee_id: identity.id, p_token: identity.token, p_file_name: f.name });
      if (error || !path) throw new Error(error?.message ?? "Could not start the upload.");
      const up = await supabase.storage.from("decks").upload(path as string, f, { contentType: "application/pdf", upsert: false });
      if (up.error) throw new Error(up.error.message.includes("size") ? "Max 5 MB" : up.error.message);
      setBusy("Saving…");
      const c = await supabase.rpc("confirm_deck_upload", { p_attendee_id: identity.id, p_token: identity.token });
      if (c.error) throw new Error(c.error.message);
      toast.success("Deck uploaded.");
      refreshMe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally { setBusy(null); }
  }

  async function remove() {
    if (!identity) return;
    setBusy("Removing…");
    const { error } = await supabase.rpc("remove_deck", { p_attendee_id: identity.id, p_token: identity.token });
    setBusy(null);
    if (error) toast.error(error.message); else { toast("Deck removed."); refreshMe(); }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-semibold">Pitch deck</p>
      <p className="mt-1 text-sm text-muted-foreground">Upload your deck (PDF, max 5 MB). It appears next to your pitch so people can open it.</p>
      <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
      {busy ? (
        <p className="mt-3 text-sm text-accent">{busy}</p>
      ) : me.deck_url ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="min-w-0 truncate text-sm">{me.deck_name}</span>
          <DeckLink url={me.deck_url} />
          <Button size="sm" variant="soft" onClick={() => input.current?.click()}>Replace</Button>
          <Button size="sm" variant="ghost" onClick={remove}>Remove</Button>
        </div>
      ) : (
        <Button className="mt-3" variant="soft" onClick={() => input.current?.click()}>Upload PDF</Button>
      )}
    </div>
  );
}
