/** Verified 2026-07-07: claude-3-5-haiku retired 2026-02-19; Haiku 4.5 is the
 *  only current Haiku ($1/M input, $5/M output). Override via ANTHROPIC_MODEL. */
export const DEFAULT_MODEL = "claude-haiku-4-5";

export const MODEL_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
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
  "Copilot",
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
