import { getToolBySlug, buildMarketplaceUrl } from "@/config/tools";

/**
 * Offers surfaced on the generation loading screen. These are matched to the
 * user's selected output type so they feel relevant, and gated so personal
 * tasks stay ad-free (mirroring the is_business rule used for result CTAs).
 */
export interface LoadingOffer {
  name: string;
  description: string;
  href: string;
}

/** Roles that lean business — used only to decide offers for ambiguous outputs. */
const BUSINESS_ROLES = new Set([
  "Marketer",
  "Founder/CEO",
  "Sales/SDR",
  "RevOps",
  "Content/SEO",
  "Customer Success",
  "Recruiter/HR",
  "Product Manager",
  "Agency Owner",
]);

/**
 * Curated top offers per output type (slugs from the tool registry), ordered by
 * monetization value. Personal output types map to [] so no offers show.
 */
const OFFERS_BY_OUTPUT: Record<string, string[]> = {
  "Email/Outreach": ["instantly", "apollo-io", "smartlead"],
  "Content/Copy": ["rytr", "notion", "canva"],
  "Strategy/Plan": ["hubspot", "close", "clay"],
  "Analysis/Research": ["semrush", "hotjar", "posthog"],
  "Code/Automation": ["n8n", "make", "zapier"],
  "Agent/Workflow": ["n8n", "make", "fireflies"],
  "Data/Spreadsheet": ["clay", "apollo-io", "uplead"],
  "Image/Creative": ["canva", "synthesia", "figma"],
  "Writing/Personal": [],
  "Learning/How-To": [],
  "Other": [],
};

/** Fallback set for an unknown ("Other") output when the role is business. */
const DEFAULT_TOP = ["hubspot", "apollo-io", "n8n"];

/**
 * Pick up to 3 relevant affiliate offers to show while a prompt generates.
 * Returns [] for personal-leaning tasks so the loading screen stays clean.
 */
export function pickLoadingOffers(
  role: string,
  outputType: string,
  campaign = "builder-loading",
): LoadingOffer[] {
  let slugs = OFFERS_BY_OUTPUT[outputType];

  // Unknown/"Other" output: only surface offers if the role clearly means business.
  if (slugs === undefined) {
    slugs = BUSINESS_ROLES.has(role) ? DEFAULT_TOP : [];
  } else if (slugs.length === 0 && outputType === "Other" && BUSINESS_ROLES.has(role)) {
    slugs = DEFAULT_TOP;
  }

  return slugs
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 3)
    .map((t) => ({
      name: t.name,
      description: t.description,
      href: buildMarketplaceUrl(t, campaign),
    }));
}
