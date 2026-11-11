import { Mic, Users, Presentation, Coffee, Sunset, Rocket, GraduationCap, Puzzle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIXP_URL } from "@/lib/event";
import { Card, Section } from "./Basics";

export function HowItWorks() {
  const steps = [
    ["Register", "30 seconds."],
    ["Pick a 5-minute stage slot", "No slot? Floor1 has four open tables for free pitch sessions."],
    ["Enter the campus in your browser", "Type your name, choose an avatar, walk in."],
  ];
  return (
    <Section eyebrow="How it works" title="Three steps. No install.">
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map(([t, d], i) => (
          <Card key={t}>
            <span className="text-gradient text-4xl font-extrabold">{i + 1}</span>
            <h3 className="mt-3 text-xl font-semibold">{t}</h3>
            <p className="mt-1 text-muted-foreground">{d}</p>
          </Card>
        ))}
      </ol>
    </Section>
  );
}

export function Campus() {
  const rooms = [
    [Mic, "Auditorium", "The stage. One startup every 5 minutes, all day."],
    [Users, "Meeting Room", "AIXP in a few minutes: a short video on what AIXP does, and someone from our team there to answer your questions."],
    [Presentation, "Show Room", "See how a company presents products inside an immersive space."],
    [Coffee, "Floor1", "Four tables for open pitch sessions. No slot needed: sit down and pitch."],
    [Sunset, "Rooftop", "The hallway track. Walk up, say hi."],
  ] as const;
  return (
    <Section eyebrow="The campus" title="Five places to be today.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(([Icon, t, d]) => (
          <Card key={t}>
            <Icon className="h-6 w-6 text-accent" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold">{t}</h3>
            <p className="mt-1 text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-sm sm:text-base">
        <b className="text-accent">How to move around:</b> click the Saratoga logo in the top-right corner of the campus. It opens the 3D map. Pick a space, including the Rooftop, and you're there.
      </div>
      <p className="mt-4 text-sm text-muted-foreground">This campus is the immersive world AIXP built for Saratoga. Today it's yours.</p>
    </Section>
  );
}

export function Why() {
  const cards = [
    [Rocket, "Founders & CEOs", "Build your own academy, immersive rooms included. See how in the Meeting Room."],
    [GraduationCap, "Creators & trainers", "Sell your courses and content from your own branded space."],
    [Puzzle, "Startups", "Integrate AIXP into your product to train your users."],
    [TrendingUp, "Investors", "AIXP is growing. Come and talk to the founder on the Rooftop."],
  ] as const;
  return (
    <Section
      eyebrow="Why AIXP is doing this"
      title="Today a meeting place. Tomorrow your academy."
      sub="AIXP turns the knowledge your organisation already has into autonomous people and measurable results. Today the campus is a meeting place. Tomorrow it can be your academy."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([Icon, t, d]) => (
          <Card key={t}>
            <Icon className="h-6 w-6 text-accent" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">{t}</h3>
            <p className="mt-1 text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
      <Button asChild variant="hero" size="xl" className="mt-8">
        <a href={AIXP_URL} target="_blank" rel="noopener noreferrer">Book a 30-minute demo</a>
      </Button>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border pb-28 sm:pb-10">
      <div className="mx-auto max-w-6xl space-y-2 px-5 py-10 text-sm text-muted-foreground">
        <p className="text-base font-bold tracking-[0.4em] text-foreground">AIXP</p>
        <p>An independent community initiative by AIXP. Not affiliated with, sponsored or endorsed by Web Summit.</p>
        <p>Virtual campus hosted in the immersive world AIXP built for Saratoga.</p>
        <p><a href={AIXP_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-4 hover:underline">aixp.it</a></p>
        <p>Stay safe and follow the instructions of the Portuguese authorities.</p>
      </div>
    </footer>
  );
}
