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

/**
 * Short, human display label for a taxonomy value, used on prompt-page pills and
 * breadcrumbs. Turns the catch-all "Other"/"Other/Any" values into readable
 * text instead of the bare word "Other" (which read as a bug to reviewers).
 */
export function pillLabel(kind: TaxonomyKind, label: string): string {
  if (kind === "tool") return label === "Other/Any" ? "Any AI tool" : label;
  if (label !== "Other") return label;
  return kind === "for" ? "Any role" : "Any task";
}

/** Natural audience nouns per role, so copy reads as English (never "for Marketer"). */
const ROLE_NOUN: Record<string, string> = {
  Marketer: "marketers",
  "Founder/CEO": "founders and CEOs",
  "Sales/SDR": "sales and SDR teams",
  RevOps: "RevOps teams",
  "Content/SEO": "content and SEO teams",
  "Customer Success": "customer success teams",
  "Recruiter/HR": "recruiters and HR teams",
  "Product Manager": "product managers",
  "Agency Owner": "agency owners",
  Student: "students",
  "Creator/Influencer": "creators and influencers",
  "Personal Use": "personal projects",
  Other: "any role",
};

/** Natural output-type nouns, so copy never reads "produce email/outreach". */
const TYPE_NOUN: Record<string, string> = {
  "Email/Outreach": "outreach emails",
  "Content/Copy": "content and copy",
  "Strategy/Plan": "strategies and plans",
  "Analysis/Research": "analysis and research",
  "Code/Automation": "code and automations",
  "Agent/Workflow": "agents and workflows",
  "Data/Spreadsheet": "spreadsheets and data",
  "Image/Creative": "images and creative work",
  "Writing/Personal": "personal writing",
  "Learning/How-To": "step-by-step guides",
  Other: "all kinds of tasks",
};

/** Display phrase for an AI tool ("Other/Any" -> "any AI assistant"). */
function toolPhrase(label: string): string {
  return label === "Other/Any" ? "any AI assistant" : label;
}

/** Unique intro copy per taxonomy page (SEO — not scaled boilerplate). */
export function taxonomyIntro(kind: TaxonomyKind, label: string): { h1: string; intro: string } {
  switch (kind) {
    case "for": {
      const who = ROLE_NOUN[label] ?? label.toLowerCase();
      return {
        h1: `AI prompts for ${who}`,
        intro: `Ready-to-use AI prompts for ${who}. Each one is copy-paste ready, tuned for your AI tool, and comes with setup steps, so you spend minutes, not hours, getting a strong first draft.`,
      };
    }
    case "tool": {
      const tool = toolPhrase(label);
      return {
        h1: label === "Other/Any" ? "Prompts for any AI assistant" : `${label} prompts`,
        intro: `A curated feed of prompts written for ${tool}. The syntax and structure are tailored to ${tool}, so you get sharper output on the first try.`,
      };
    }
    case "type": {
      const noun = TYPE_NOUN[label] ?? label.toLowerCase();
      return {
        h1: `Prompts for ${noun}`,
        intro: `Ready-to-use prompts for ${noun}. Browse the best community-upvoted examples, copy the one that fits, and remix it for your situation.`,
      };
    }
  }
}

/** 3 real Q&As per taxonomy page for FAQPage schema + on-page FAQ. */
export function taxonomyFaqs(kind: TaxonomyKind, label: string): { q: string; a: string }[] {
  const base = [
    {
      q: `Are these prompts free to use?`,
      a: `Yes. Every prompt on Promptbuildr is free to copy and use. You can also generate your own custom prompt from the builder in seconds.`,
    },
    {
      q: `Which AI tools do these prompts work with?`,
      a: `They work with Claude, ChatGPT, Gemini, Grok, DeepSeek, Muse, Microsoft Copilot, GitHub Copilot, Cursor, Perplexity, and image tools. When you generate a prompt you pick your tool, and the prompt's syntax is tailored to it.`,
    },
  ];
  const specific =
    kind === "for"
      ? {
          q: `How do I customize one of these prompts for my own work?`,
          a: `Open any prompt, copy it, and fill in the [BRACKETED] placeholders with your specifics. Or click "Remix" to load it into the builder and regenerate it around your exact task.`,
        }
      : {
          q: `Can I get a prompt tailored to my exact task?`,
          a: `Yes. Use the builder on the homepage. Describe what you're trying to do, pick your role and tool, and you'll get a custom, ready-to-paste prompt with instructions.`,
        };
  return [...base, specific];
}
