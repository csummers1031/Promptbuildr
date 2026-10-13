import { HD } from "@/config/branding";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://promptbuildr.ai").replace(/\/$/, "");
export const SITE_NAME = "Promptbuildr";

type JsonLd = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#org`;

export function orgJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon.png`,
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
  return [
    {
      q: `What does the "${args.title}" prompt do?`,
      a: directAnswer(args.role, args.outputType, args.title),
    },
    {
      q: "Which AI tool is this prompt for?",
      a: `It's tuned for ${args.aiTool}, but it works in other assistants too — paste it into ChatGPT, Claude, or Gemini and adjust the formatting if needed.`,
    },
    {
      q: "How do I use this prompt?",
      a: `Copy the prompt, replace any bracketed placeholders with your own details, and paste it into ${args.aiTool}. Then follow the setup steps on this page to refine the output.`,
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

/** 40–60 word extractable direct-answer summary for AEO. */
export function directAnswer(role: string, outputType: string, title: string): string {
  const who = role === "Personal Use" || role === "Student" || role === "Creator/Influencer" ? "anyone" : `${role} teams`;
  return `This prompt helps ${who} produce ${outputType.toLowerCase()} faster: "${title}". Copy the ready-to-paste prompt, fill in the bracketed details specific to your situation, and run it in your AI tool for a high-quality first draft you can refine in minutes.`;
}
