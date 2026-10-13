import toolsData from "./tools.data.json";

export const TOOL_CATEGORIES = [
  "crm",
  "email-outreach",
  "hosting",
  "ai-tools",
  "analytics",
  "design",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface RegistryTool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  /**
   * Destination URL. Either a Promptbuildr-specific partner tracking link
   * (used as-is — partner dashboards already separate Promptbuildr's traffic)
   * or a Hacking Demand Discount Marketplace listing (UTMs appended at render).
   */
  url: string;
}

export const TOOLS: RegistryTool[] = toolsData as RegistryTool[];

/**
 * Normalize a tool name for matching: lowercase, alphanumeric only.
 * "HubSpot CRM" -> "hubspotcrm", "n8n" -> "n8n", "Apollo.io" -> "apolloio"
 */
export function normalizeToolName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));
const byNormalizedName = new Map(TOOLS.map((t) => [normalizeToolName(t.name), t]));

export function getToolBySlug(slug: string): RegistryTool | undefined {
  return bySlug.get(slug);
}

/**
 * Registry lookup by slug OR normalized display name. This is the hook that
 * auto-upgrades off-registry references: once a tool is added to the registry
 * under a matching name, every stored reference resolves to the marketplace
 * URL at render time — no backfill.
 */
export function findRegistryTool(nameOrSlug: string): RegistryTool | undefined {
  return bySlug.get(nameOrSlug) ?? byNormalizedName.get(normalizeToolName(nameOrSlug));
}

/**
 * Resolve a tool's outbound URL. Hacking Demand marketplace links get
 * attribution UTMs (campaign = primary prompt category tag); partner tracking
 * links are returned verbatim — their dashboards already attribute Promptbuildr
 * separately, and extra params on a tracking link add risk for no gain.
 */
export function buildMarketplaceUrl(tool: RegistryTool, campaign: string): string {
  const url = new URL(tool.url);
  const isHackingDemand =
    url.hostname === "hackingdemand.com" || url.hostname.endsWith(".hackingdemand.com");
  if (!isHackingDemand) return tool.url;
  url.searchParams.set("utm_source", "promptbuildr");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
  return url.toString();
}

/** Compact registry listing injected into the meta-prompt. */
export function registryForPrompt(): string {
  return TOOLS.map((t) => `${t.slug}: ${t.name} — ${t.description}`).join("\n");
}
