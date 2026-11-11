import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "aixp-campus-identity";
type Identity = { id: string; token: string };

export type Me = {
  id: string; full_name: string; company: string; role: string; looking_for: string[];
  waitlisted: boolean; slot_id: string | null; slot_starts_at: string | null; pitch_title: string | null;
};
export type Slot = { id: string; starts_at: string; taken: boolean; company: string | null; pitch_title: string | null };
export type DirEntry = {
  id: string; full_name: string; company: string; role: string; one_liner: string;
  looking_for: string[]; linkedin_url: string | null; slot_starts_at: string | null;
};

type Ctx = {
  identity: Identity | null;
  me: Me | null;
  setIdentity: (i: Identity | null) => void;
  refreshMe: () => void;
};
const C = createContext<Ctx>({ identity: null, me: null, setIdentity: () => {}, refreshMe: () => {} });

export function CampusProvider({ children }: { children: ReactNode }) {
  const [identity, setIdState] = useState<Identity | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIdState(JSON.parse(raw));
    } catch {}
  }, []);

  const setIdentity = useCallback((i: Identity | null) => {
    try {
      if (i) localStorage.setItem(KEY, JSON.stringify(i));
      else localStorage.removeItem(KEY);
    } catch {}
    setIdState(i);
  }, []);

  const meQ = useQuery({
    queryKey: ["me", identity?.id],
    enabled: !!identity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_me", { p_attendee_id: identity!.id, p_token: identity!.token });
      if (error) throw error;
      const row = (data as Me[] | null)?.[0] ?? null;
      if (!row) setIdentity(null);
      return row;
    },
  });

  // Live updates: any slot change refreshes slots, stats, directory and me.
  useEffect(() => {
    const ch = supabase
      .channel(`slots-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "slots" }, () => {
        qc.invalidateQueries({ queryKey: ["slots"] });
        qc.invalidateQueries({ queryKey: ["stats"] });
        qc.invalidateQueries({ queryKey: ["directory"] });
        qc.invalidateQueries({ queryKey: ["me"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const refreshMe = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["slots"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["directory"] });
  }, [qc]);

  return <C.Provider value={{ identity, me: meQ.data ?? null, setIdentity, refreshMe }}>{children}</C.Provider>;
}

export const useCampus = () => useContext(C);

export function useSlots() {
  return useQuery({
    queryKey: ["slots"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_slots");
      if (error) throw error;
      return (data ?? []) as Slot[];
    },
    refetchInterval: 60_000,
  });
}
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_stats");
      if (error) throw error;
      const r = (data as { registered: number; slots_left: number }[])?.[0];
      return { registered: Number(r?.registered ?? 0), slotsLeft: Number(r?.slots_left ?? 0) };
    },
    refetchInterval: 30_000,
  });
}
export function useDirectory() {
  return useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_directory");
      if (error) throw error;
      return (data ?? []) as DirEntry[];
    },
    refetchInterval: 60_000,
  });
}

export function useNow(ms = 15_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
