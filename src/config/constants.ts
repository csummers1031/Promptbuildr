/** Generation model. Sonnet 5.5 (current gen) for materially better prompt
 *  quality than the Haiku tier, at negligible cost for our volume. Override via
 *  ANTHROPIC_MODEL. Pricing below is $/MTok for every model we might run so the
 *  spend tracker never silently falls back to the wrong rate. */
export const DEFAULT_MODEL = "claude-sonnet-5-5";

export const MODEL_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2.0, output: 10.0 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-opus-5-5": { input: 4.0, output: 20.0 },
};

export const ROLES = [
  "Marketer",
  "Founder/CEO",
  "Sales/SDR",
  "RevOps",
  "Content/SEO",
  "Customer Success",
  "Recruiter/HR",
  "Product Manager",
  "Agency Owner",
  "Student",
  "Creator/Influencer",
  "Personal Use",
  "Other",
] as const;
export type Role = (typeof ROLES)[number];

export const AI_TOOLS = [
  "Claude",
  "ChatGPT",
  "Gemini",
  "Grok",
  "DeepSeek",
  "Muse",
  "Microsoft Copilot",
  "GitHub Copilot",
  "Cursor",
  "Perplexity",
  "Midjourney/Image AI",
  "Other/Any",
] as const;
export type AiTool = (typeof AI_TOOLS)[number];

export const OUTPUT_TYPES = [
  "Email/Outreach",
  "Content/Copy",
  "Strategy/Plan",
  "Analysis/Research",
  "Code/Automation",
  "Agent/Workflow",
  "Data/Spreadsheet",
  "Image/Creative",
  "Writing/Personal",
  "Learning/How-To",
  "Other",
] as const;
export type OutputType = (typeof OUTPUT_TYPES)[number];

/** Off-registry recommendation cap (approved requirement 4f). */
export const MAX_OFF_REGISTRY_TOOLS = 2;
export const MAX_RECOMMENDED_TOOLS = 3;
