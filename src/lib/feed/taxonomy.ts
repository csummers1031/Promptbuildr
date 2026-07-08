import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";

/** URL-safe slug for a taxonomy label. "Founder/CEO" -> "founder-ceo". */
export function taxonomySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMap(labels: readonly string[]): Map<string, string> {
  return new Map(labels.map((l) => [taxonomySlug(l), l]));
}

const ROLE_MAP = buildMap(ROLES);
const TOOL_MAP = buildMap(AI_TOOLS);
const TYPE_MAP = buildMap(OUTPUT_TYPES);

export const roleFromSlug = (s: string) => ROLE_MAP.get(s);
export const toolFromSlug = (s: string) => TOOL_MAP.get(s);
export const typeFromSlug = (s: string) => TYPE_MAP.get(s);

export const roleSlugs = () => [...ROLE_MAP.keys()];
export const toolSlugs = () => [...TOOL_MAP.keys()];
export const typeSlugs = () => [...TYPE_MAP.keys()];

export type TaxonomyKind = "for" | "tool" | "type";

/** Unique intro copy per taxonomy page (SEO — not scaled boilerplate). */
export function taxonomyIntro(kind: TaxonomyKind, label: string): { h1: string; intro: string } {
  switch (kind) {
    case "for":
      return {
        h1: `AI prompts for ${label}`,
        intro: `Ready-to-use AI prompts built for ${label}. Each one is copy-paste ready, tuned for your AI tool, and comes with setup steps — so you spend minutes, not hours, getting a strong first draft.`,
      };
    case "tool":
      return {
        h1: `${label} prompts`,
        intro: `A curated feed of prompts written specifically for ${label}. Syntax and structure are tailored to how ${label} works best, so you get sharper output on the first try.`,
      };
    case "type":
      return {
        h1: `${label} prompts`,
        intro: `Prompts that produce ${label.toLowerCase()} — for work and life. Browse the best community-upvoted examples, copy the one that fits, and remix it for your situation.`,
      };
  }
}

/** 3 real Q&As per taxonomy page for FAQPage schema + on-page FAQ. */
export function taxonomyFaqs(kind: TaxonomyKind, label: string): { q: string; a: string }[] {
  const base = [
    {
      q: `Are these ${label} prompts free to use?`,
      a: `Yes. Every prompt on Promptbuildr is free to copy and use. You can also generate your own custom prompt from the builder in seconds.`,
    },
    {
      q: `Which AI tools do these prompts work with?`,
      a: `They work with Claude, ChatGPT, Gemini, Copilot, and image tools. When you generate a prompt you pick your tool, and the prompt's syntax is tailored to it.`,
    },
  ];
  const specific =
    kind === "for"
      ? {
          q: `How do I customize a prompt for my own ${label} work?`,
          a: `Open any prompt, copy it, and fill in the [BRACKETED] placeholders with your specifics. Or click "Remix" to load it into the builder and regenerate it around your exact task.`,
        }
      : {
          q: `Can I get a prompt tailored to my exact task?`,
          a: `Yes — use the builder on the homepage. Describe what you're trying to do, pick your role and tool, and you'll get a custom, ready-to-paste prompt with instructions.`,
        };
  return [...base, specific];
}
