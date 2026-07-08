import { HD, hdUrl } from "@/config/branding";

/**
 * Conditional service-CTA routing (Core Feature 5), keyed on is_business.
 * Personal/consumer users get nothing — a clean, monetization-free experience.
 */

export interface CtaModule {
  kind: "agent-build" | "consulting";
  heading: string;
  body: string;
  ctaLabel: string;
  href: string;
}

const DEMAND_GEN_ROLES = new Set([
  "Marketer",
  "Founder/CEO",
  "Sales/SDR",
  "RevOps",
  "Agency Owner",
]);

const DEMAND_GEN_TAG_HINTS = [
  "demand",
  "outbound",
  "content",
  "lead",
  "seo",
  "cold",
  "ppc",
  "paid",
  "growth",
  "pipeline",
  "email",
  "ads",
  "gtm",
  "acquisition",
];

interface CtaInput {
  isBusiness: boolean;
  isAgentOrAutomation: boolean;
  outputType: string;
  role: string;
  categoryTags: string[];
  /** primary campaign tag for UTMs */
  campaign: string;
}

export function selectCta(input: CtaInput): CtaModule | null {
  if (!input.isBusiness) return null;

  const isAutomationOutput =
    input.outputType === "Agent/Workflow" || input.outputType === "Code/Automation";

  // Prominent build module: automation/agent work
  if (input.isAgentOrAutomation || isAutomationOutput) {
    return {
      kind: "agent-build",
      heading: "Want this built and running in your stack?",
      body: "Hacking Demand builds HubSpot Breeze + Claude AI agents that put prompts like this to work end-to-end.",
      ctaLabel: "See how we build AI agents",
      href: hdUrl(HD.services, input.campaign),
    };
  }

  // Softer consulting module: demand-gen roles + relevant tags
  const tagText = input.categoryTags.join(" ").toLowerCase();
  const isDemandGen =
    DEMAND_GEN_ROLES.has(input.role) &&
    DEMAND_GEN_TAG_HINTS.some((h) => tagText.includes(h));
  if (isDemandGen) {
    return {
      kind: "consulting",
      heading: "Want this done for you?",
      body: "Hacking Demand runs demand-gen and outbound programs for teams that would rather ship than fiddle.",
      ctaLabel: "Talk to Hacking Demand",
      href: hdUrl(HD.consulting, input.campaign),
    };
  }

  // Other business cases: inline tool links only, no CTA module.
  return null;
}
