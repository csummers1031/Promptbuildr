import { HD } from "@/config/branding";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://promptbuildr.ai").replace(/\/$/, "");
export const SITE_NAME = "Promptbuildr";

type JsonLd = Record<string, unknown>;

/**
 * Serialize JSON-LD for an inline <script> tag, escaping characters that could
 * break out of the tag or the enclosing HTML. LLM-generated prompt text and
 * titles flow into these objects, so a prompt containing "</script>" would
 * otherwise close the tag early (invalid structured data, and stored XSS if
 * followed by markup). Escapes <, >, &, and the JS line separators U+2028/9.
 */
export function safeJsonLd(data: unknown): string {
  // U+2028/U+2029 are valid in JSON strings but are JS line terminators, so
  // build them at runtime to avoid putting literal separators in this source.
  const cls = new RegExp("[<>&" + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + "]", "g");
  return JSON.stringify(data).replace(cls, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

export const ORG_ID = `${SITE_URL}/#org`;

export function orgJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Promptbuildr turns plain-language tasks into high-quality, ready-to-use AI prompts for business and personal use.",
    sameAs: [HD.home],
  };
}

export function webSiteJsonLd(): JsonLd {
  // SearchAction (sitelinks search box) was retired by Google in Nov 2024, so
  // it's omitted. The WebSite node stays for the site-name feature.
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * CreativeWork schema for a prompt page — the prompt IS a reusable text asset,
 * so the actual prompt text is marked up in `text` (the field AI answer engines
 * extract). Replaces HowTo (deprecated by Google in 2023 and a semantic
 * mismatch for a prompt).
 */
export function creativeWorkJsonLd(args: {
  title: string;
  promptText: string;
  abstract: string;
  url: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
  aiTool: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: args.title,
    headline: args.title,
    text: args.promptText,
    abstract: args.abstract,
    url: args.url,
    mainEntityOfPage: args.url,
    inLanguage: "en",
    isAccessibleForFree: true,
    datePublished: args.datePublished,
    dateModified: args.dateModified,
    keywords: args.keywords.filter(Boolean).join(", "),
    about: args.aiTool ? { "@type": "Thing", name: args.aiTool } : undefined,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

/**
 * CollectionPage + nested ItemList for a feed/taxonomy page. The ItemList
 * enumerates each prompt's own URL so crawlers/AI discover every item page
 * (only list what's actually rendered on this page).
 */
export function collectionPageJsonLd(args: {
  name: string;
  description: string;
  url: string;
  items: { url: string; name: string }[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.name,
    description: args.description,
    url: args.url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: args.items.length,
      itemListElement: args.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: it.url,
        name: it.name,
      })),
    },
  };
}

/** Genuine, page-specific Q&As for a prompt page (content + FAQPage schema). */
export function promptFaqs(args: {
  title: string;
  aiTool: string;
  role: string;
  outputType: string;
}): { q: string; a: string }[] {
  const anyTool = args.aiTool === "Other/Any";
  const toolPhrase = anyTool ? "your AI assistant" : args.aiTool;
  return [
    {
      q: `What does the "${args.title}" prompt do?`,
      a: directAnswer(args.outputType, args.title),
    },
    {
      q: "Which AI tool is this prompt for?",
      a: anyTool
        ? "It works in any AI assistant. Paste it into ChatGPT, Claude, Gemini, or your tool of choice and adjust the formatting if needed."
        : `It's tuned for ${args.aiTool}, but it works in other assistants too. Paste it into ChatGPT, Claude, or Gemini and adjust the formatting if needed.`,
    },
    {
      q: "How do I use this prompt?",
      a: `Copy the prompt, replace any bracketed placeholders with your own details, and paste it into ${toolPhrase}. Then follow the setup steps on this page to refine the output.`,
    },
  ];
}

export function faqJsonLd(qas: { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };
}

/**
 * Natural goal phrase per output type, so the direct answer reads as a sentence
 * (never "produce other faster"). Each phrase slots into "helps you ___ faster".
 */
const OUTPUT_GOAL: Record<string, string> = {
  "Email/Outreach": "write outreach emails",
  "Content/Copy": "create content and copy",
  "Strategy/Plan": "build a clear plan",
  "Analysis/Research": "run the analysis and research",
  "Code/Automation": "write code and automations",
  "Agent/Workflow": "design an agent or workflow",
  "Data/Spreadsheet": "organize data in a spreadsheet",
  "Image/Creative": "create images and other creative work",
  "Writing/Personal": "handle the writing",
  "Learning/How-To": "learn something new",
  "Other": "get the job done",
};

/** 40–60 word extractable direct-answer summary for AEO. */
export function directAnswer(outputType: string, title: string): string {
  const goal = OUTPUT_GOAL[outputType] ?? "get the job done";
  return `This prompt helps you ${goal} faster: "${title}". Copy the ready-to-paste prompt, fill in the bracketed details for your situation, and run it in your AI tool for a high-quality first draft you can refine in minutes.`;
}

/**
 * Clamp text to a meta-description length without cutting mid-word. Trims to the
 * last whole word under `max` and appends an ellipsis. (slice(0, n) alone left
 * descriptions ending mid-word, e.g. "...fill in the bracketed d".)
 */
export function clampForMeta(text: string, max = 157): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "") + "…";
}

/** Consistent share-sheet title. Avoids the clumsy "Other/Any prompt". */
export function shareTitle(title: string, aiTool: string): string {
  const tool = aiTool === "Other/Any" ? "AI" : aiTool;
  return `${title}: a ready-to-use ${tool} prompt`;
}
