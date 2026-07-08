import { HD } from "@/config/branding";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://promptbuildr.ai").replace(/\/$/, "");
export const SITE_NAME = "Promptbuildr";

type JsonLd = Record<string, unknown>;

export function orgJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Promptbuildr turns plain-language tasks into high-quality, ready-to-use AI prompts for business and personal use.",
    sameAs: [HD.home, "https://hackingdemand.com"],
  };
}

export function webSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/prompts?role={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
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

/** HowTo schema for a promoted prompt page — steps = the instructions. */
export function howToJsonLd(args: {
  name: string;
  description: string;
  url: string;
  steps: string[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: args.name,
    description: args.description,
    url: args.url,
    step: args.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
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
