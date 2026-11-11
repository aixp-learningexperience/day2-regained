import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HASHTAG, SHARE_TEXT } from "@/lib/event";
import { Section } from "./Basics";

export function Thanks() {
  const url = () => window.location.origin + "/";
  return (
    <Section eyebrow="Say thanks" title={<span className="text-gradient">{HASHTAG}</span>}
      sub="If today was useful, post a photo, reel or story from inside the campus with #thxAIXP. We'll reshare the best ones.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="hero" size="xl" onClick={async () => {
          try { await navigator.clipboard.writeText(HASHTAG); toast.success("Copied #thxAIXP"); } catch { toast(HASHTAG); }
        }}>Copy hashtag</Button>
        <Button variant="soft" size="xl" onClick={() => window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(SHARE_TEXT + " " + url())}`, "_blank", "noopener")}>Share on LinkedIn</Button>
        <Button variant="soft" size="xl" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url())}`, "_blank", "noopener")}>Share on X</Button>
      </div>
    </Section>
  );
}
