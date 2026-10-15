import { getToolBySlug, buildMarketplaceUrl } from "@/config/tools";

/**
 * Offers surfaced on the generation loading screen. Matched to the user's task
 * (keywords) and selected output type so they feel relevant, and gated so truly
 * personal tasks stay ad-free. ONLY earning partners appear here, so every slot
 * can generate revenue.
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
 * Curated top offers per output type (earning slugs), used when we have no task
 * to key off. Personal output types map to [] so no offers show.
 */
const OFFERS_BY_OUTPUT: Record<string, string[]> = {
  "Email/Outreach": ["instantly", "apollo-io", "smartlead"],
  "Content/Copy": ["rytr", "quillbot", "gamma"],
  "Strategy/Plan": ["hubspot", "close", "apollo-io"],
  "Analysis/Research": ["omniseo", "hotjar", "databox"],
  "Code/Automation": ["n8n", "make", "railway"],
  "Agent/Workflow": ["n8n", "mindstudio", "make"],
  "Data/Spreadsheet": ["apollo-io", "uplead", "databox"],
  "Image/Creative": ["synthesia", "gamma", "descript"],
  "Writing/Personal": [],
  "Learning/How-To": [],
  "Other": [],
};

/** Output types that are inherently personal — never show offers for these. */
const PERSONAL_OUTPUTS = new Set(["Writing/Personal", "Learning/How-To"]);

/** Fallback set for an unknown ("Other") output when the role is business. */
const DEFAULT_TOP = ["hubspot", "apollo-io", "n8n"];

/**
 * Task-keyword -> earning tool slugs. A task that mentions any term pulls in that
 * group's tools, so the loading screen reflects what the person is actually
 * doing (a "website" task shows hosting, not CRM). Terms are specific enough to
 * avoid firing on generic personal tasks.
 */
const KEYWORD_GROUPS: { terms: string[]; slugs: string[] }[] = [
  {
    terms: ["website", "web app", "webapp", "web application", "landing page", "deploy", "hosting", "frontend", "full-stack", "full stack", "saas"],
    slugs: ["railway", "netlify", "gamma"],
  },
  {
    terms: ["automat", "workflow", "agent", "integrat", "no-code", "nocode", "scrape"],
    slugs: ["n8n", "make", "mindstudio", "lindy"],
  },
  {
    terms: ["cold email", "outreach", "cold outbound", "lead gen", "prospect", "email list", "email campaign", "deliverability", "cold call"],
    slugs: ["instantly", "apollo-io", "smartlead", "lemlist", "uplead", "hunter-io", "seamless-ai"],
  },
  {
    terms: ["crm", "pipeline", "deal flow", "sales process", "contact management"],
    slugs: ["hubspot", "close", "folk"],
  },
  {
    terms: ["blog", "copywriting", "ad copy", "marketing copy", "newsletter", "content calendar", "product description"],
    slugs: ["rytr", "quillbot", "gamma"],
  },
  {
    terms: ["seo", "search engine", "keyword", "rank on google", "backlink", "serp"],
    slugs: ["omniseo", "rytr"],
  },
  {
    terms: ["video", "podcast", "voiceover", "voice over", "avatar", "text to speech", "screen record", "youtube"],
    slugs: ["synthesia", "descript", "elevenlabs"],
  },
  {
    terms: ["logo", "graphic", "banner", "email design", "email template", "flyer", "slide deck", "presentation"],
    slugs: ["gamma", "beefree", "stripo"],
  },
  {
    terms: ["analytics", "dashboard", "kpi", "metrics", "heatmap", "conversion rate"],
    slugs: ["databox", "hotjar", "omniseo"],
  },
  {
    terms: ["meeting notes", "transcribe", "meeting summar", "call notes"],
    slugs: ["fireflies"],
  },
  {
    terms: ["ai assistant", "ai agent", "build an agent", "llm"],
    slugs: ["claude", "mindstudio", "lindy", "customgpt"],
  },
  {
    terms: ["chatbot", "knowledge base", "help center", "helpdesk", "help desk", "support bot", "customer support", "internal search", "custom gpt", "customgpt"],
    slugs: ["customgpt", "lindy", "mindstudio"],
  },
];

/** Deterministic string hash (cyrb53-lite) so the same task shuffles the same way. */
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher-Yates — varies the pick across tasks, stable for one task. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Collect earning slugs whose keyword group matches the task text. */
function slugsFromTask(task: string): string[] {
  const t = task.toLowerCase();
  const out: string[] = [];
  for (const group of KEYWORD_GROUPS) {
    if (group.terms.some((term) => t.includes(term))) {
      for (const slug of group.slugs) if (!out.includes(slug)) out.push(slug);
    }
  }
  return out;
}

/**
 * Pick up to 3 relevant affiliate offers to show while a prompt generates.
 * - With a task, matches keywords and varies the pick per task (seeded shuffle).
 * - Without a task (or no keyword match), falls back to the curated per-output
 *   set, then to the business-role default.
 * Returns [] for personal-leaning tasks so the loading screen stays clean.
 */
export function pickLoadingOffers(
  role: string,
  outputType: string,
  task = "",
  campaign = "builder-loading",
): LoadingOffer[] {
  // Personal output types stay ad-free no matter what.
  if (PERSONAL_OUTPUTS.has(outputType)) return [];

  let slugs: string[] = [];

  // 1. Task keywords (the relevance + variety win).
  const matched = task.trim() ? slugsFromTask(task) : [];
  if (matched.length > 0) {
    slugs = seededShuffle(matched, seedFrom(task.trim().toLowerCase()));
  } else {
    // 2. Curated per-output set.
    const curated = OFFERS_BY_OUTPUT[outputType];
    if (curated === undefined) {
      // Unknown output: only for business roles.
      slugs = BUSINESS_ROLES.has(role) ? DEFAULT_TOP : [];
    } else if (curated.length === 0 && outputType === "Other" && BUSINESS_ROLES.has(role)) {
      slugs = DEFAULT_TOP;
    } else {
      slugs = curated;
    }
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
