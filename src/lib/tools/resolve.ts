/**
 * Validation + resolution for model tool recommendations (approved req. 4).
 *
 * Storage rule (4c): we persist tool references by normalized name (plus the
 * validated homepage URL for off-registry tools as a fallback destination).
 * Destination URLs are resolved AT RENDER TIME from the registry, so adding a
 * tool to the registry later upgrades every existing reference to the
 * marketplace link with UTMs — no backfill.
 */
import {
  findRegistryTool,
  buildMarketplaceUrl,
  normalizeToolName,
} from "@/config/tools";
import { MAX_OFF_REGISTRY_TOOLS, MAX_RECOMMENDED_TOOLS } from "@/config/constants";
import { checkPublicText } from "@/lib/moderation/blocklist";

/** Raw shape the model returns inside recommended_tools[]. */
export interface RawToolRecommendation {
  name: string;
  registry_slug: string | null;
  homepage_url: string | null;
}

/** Validated, storable reference. */
export interface ToolRef {
  /** Display name as the model gave it (sanitized). */
  name: string;
  /** Normalized matching key — the stored identity of the reference. */
  normalized: string;
  /** Set when the recommendation matched the registry at generation time. */
  registrySlug: string | null;
  /** Validated official homepage — off-registry fallback destination only. */
  homepageUrl: string | null;
}

export interface ResolvedToolLink {
  name: string;
  /** null => render as plain text, no link */
  href: string | null;
  source: "registry" | "off-registry" | "none";
}

const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
  "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy", "tiny.cc",
]);

/**
 * Sane-domain validation for off-registry homepage links (4b): https only,
 * real hostname (no IPs, no userinfo, no ports, no shorteners), shallow path,
 * no query/fragment. Anything failing returns null -> link is dropped, name
 * renders as plain text. Never render a fabricated or suspicious URL.
 */
export function validateHomepageUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string" || raw.length > 200) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (URL_SHORTENERS.has(host) || URL_SHORTENERS.has(host.replace(/^www\./, ""))) return null;
  // Homepages only: allow at most one shallow path segment, no query/hash
  if (url.search || url.hash) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 1) return null;
  return `https://${host}${segments.length ? `/${segments[0]}` : ""}`;
}

/** Sanitize a model-supplied tool display name. */
function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 60) return null;
  // No URLs or markup smuggled into names
  if (/https?:\/\/|[<>[\]{}]/.test(name)) return null;
  if (checkPublicText(name).blocked) return null;
  return name;
}

/**
 * Validate the model's recommended_tools array into storable ToolRefs.
 * - registry_slug values are checked against the registry (unknown -> treated
 *   as off-registry by name, never invented)
 * - off-registry entries capped at MAX_OFF_REGISTRY_TOOLS, total capped at
 *   MAX_RECOMMENDED_TOOLS
 * - names blocklist-checked and sanitized; homepage URLs domain-validated
 */
export function validateRecommendations(raw: unknown): ToolRef[] {
  if (!Array.isArray(raw)) return [];
  const refs: ToolRef[] = [];
  const seen = new Set<string>();
  let offRegistryCount = 0;

  for (const entry of raw) {
    if (refs.length >= MAX_RECOMMENDED_TOOLS) break;
    if (typeof entry !== "object" || entry === null) continue;
    const rec = entry as Partial<RawToolRecommendation>;

    const name = sanitizeName(rec.name);
    if (!name) continue;
    const normalized = normalizeToolName(name);
    if (!normalized || seen.has(normalized)) continue;

    // Prefer registry match: by claimed slug first, then by name.
    const registryTool =
      (typeof rec.registry_slug === "string" ? findRegistryTool(rec.registry_slug) : undefined) ??
      findRegistryTool(name);

    if (registryTool) {
      seen.add(normalized);
      refs.push({
        name: registryTool.name,
        normalized: normalizeToolName(registryTool.name),
        registrySlug: registryTool.slug,
        homepageUrl: null,
      });
      continue;
    }

    // Off-registry path
    if (offRegistryCount >= MAX_OFF_REGISTRY_TOOLS) continue;
    const homepageUrl = validateHomepageUrl(rec.homepage_url);
    seen.add(normalized);
    offRegistryCount++;
    refs.push({ name, normalized, registrySlug: null, homepageUrl });
  }

  return refs;
}

/**
 * Render-time resolution: registry (by stored slug OR normalized name) wins
 * and gets the marketplace URL + UTMs; otherwise the validated homepage with
 * no UTMs; otherwise plain text.
 */
export function resolveToolLink(ref: ToolRef, campaign: string): ResolvedToolLink {
  const registryTool = findRegistryTool(ref.registrySlug ?? ref.normalized) ?? findRegistryTool(ref.name);
  if (registryTool) {
    return {
      name: registryTool.name,
      href: buildMarketplaceUrl(registryTool, campaign),
      source: "registry",
    };
  }
  if (ref.homepageUrl) {
    return { name: ref.name, href: ref.homepageUrl, source: "off-registry" };
  }
  return { name: ref.name, href: null, source: "none" };
}

/** Off-registry refs from a generation — feed for the tool_opportunities log. */
export function offRegistryRefs(refs: ToolRef[]): ToolRef[] {
  return refs.filter((r) => r.registrySlug === null);
}
