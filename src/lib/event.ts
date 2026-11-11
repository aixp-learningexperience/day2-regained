import { z } from "zod";

export const SITE_URL = "https://day2-regained.aixp.io";
export const CAMPUS_URL = "https://meta.easyteach.cloud";
export const AIXP_URL = "https://www.aixp.it";
export const TOTAL_SLOTS = 132;
export const SLOT_MINUTES = 5;
export const ROLES = ["Founder / CEO", "Startup team", "Content creator / Trainer", "Investor", "Other"] as const;
export const LOOKING_FOR = [
  "Investors",
  "Customers",
  "Partners",
  "Co-founders / Talent",
  "Startups to invest in",
  "Press / Visibility",
] as const;
export const HASHTAG = "#thxAIXP";
export const SHARE_TEXT =
  "Web Summit Day 2 got cancelled by Storm Charles. I pitched anyway, inside a virtual campus. #thxAIXP";

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  company: z.string().trim().min(1, "Please enter your company or project").max(100),
  role: z.enum(ROLES, { errorMap: () => ({ message: "Please choose who you are" }) }),
  email: z.string().trim().email("Please enter a valid email").max(255),
  linkedin_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/i.test(v), "Enter a full URL starting with https://")
    .optional()
    .default(""),
  one_liner: z.string().trim().min(3, "Tell us what you do").max(140, "Max 140 characters"),
  looking_for: z.array(z.enum(LOOKING_FOR)).min(1, "Pick at least one"),
  show_in_directory: z.boolean(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to register" }) }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const pitchSchema = z.string().trim().min(3, "At least 3 characters").max(80, "Max 80 characters");

export function fmtLisbon(iso: string | Date) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" });
}
export function fmtLocal(iso: string | Date) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export type Person = { id: string; role: string; looking_for: string[] };

const SEEKS_ROLE: Record<string, string[]> = {
  Investors: ["Investor"],
  "Startups to invest in": ["Founder / CEO", "Startup team"],
  "Co-founders / Talent": ["Founder / CEO", "Startup team", "Other"],
  Partners: ["Founder / CEO", "Startup team", "Content creator / Trainer"],
  Customers: ["Founder / CEO", "Startup team", "Investor", "Other"],
  "Press / Visibility": ["Content creator / Trainer"],
};
const ROLE_OFFERS: Record<string, string[]> = {
  Investor: ["Investors"],
  "Founder / CEO": ["Startups to invest in", "Partners", "Co-founders / Talent"],
  "Startup team": ["Startups to invest in", "Partners", "Co-founders / Talent"],
  "Content creator / Trainer": ["Press / Visibility", "Partners"],
  Other: ["Partners"],
};

/** Complementarity score: what I seek vs. who they are, and vice versa, plus shared goals. */
export function matchScore(me: Person, other: Person) {
  if (me.id === other.id) return -1;
  let s = 0;
  for (const want of me.looking_for) if (SEEKS_ROLE[want]?.includes(other.role)) s += 3;
  for (const want of other.looking_for) if (SEEKS_ROLE[want]?.includes(me.role)) s += 2;
  // Mutual fit: I offer what they seek
  for (const offer of ROLE_OFFERS[me.role] ?? []) if (other.looking_for.includes(offer)) s += 1;
  s += other.looking_for.filter((x) => me.looking_for.includes(x)).length * 0.5;
  return s;
}

export function bestMatches<T extends Person>(me: Person, people: T[], n = 6): T[] {
  return people
    .map((p) => ({ p, s: matchScore(me, p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.p);
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
export function buildIcs(startIso: string, title: string) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
  const esc = (t: string) => t.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AIXP//Virtual Campus//EN",
    "BEGIN:VEVENT",
    `UID:${start.getTime()}@aixp-campus`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc("My pitch on the AIXP Virtual Campus stage: " + title)}`,
    `DESCRIPTION:${esc(`Be in the Auditorium 10 minutes early (Saratoga logo, top right → 3D map → Auditorium). 4 minutes to pitch, 1 minute for questions. Enter: ${CAMPUS_URL}`)}`,
    `LOCATION:${CAMPUS_URL}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Pitch reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
