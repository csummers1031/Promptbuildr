/**
 * Hacking Demand destination URLs. Each can be overridden by an env var once
 * the real page exists; until then they SAFELY fall back to the HD homepage so
 * nothing 404s at launch. Set HD_* env vars to point at real pages.
 */
const HOME = "https://hackingdemand.com";

function url(envVar: string | undefined, fallback: string): string {
  return envVar && /^https?:\/\//.test(envVar) ? envVar : fallback;
}

export const HD = {
  home: HOME,
  services: url(process.env.NEXT_PUBLIC_HD_SERVICES, HOME),
  consulting: url(process.env.NEXT_PUBLIC_HD_CONSULTING, HOME),
  marketplace: url(process.env.NEXT_PUBLIC_HD_MARKETPLACE, HOME),
  blog: url(process.env.NEXT_PUBLIC_HD_BLOG, HOME),
  demandHacks: url(process.env.NEXT_PUBLIC_HD_DEMAND_HACKS, HOME),
};

export function hdUrl(base: string, campaign: string): string {
  const u = new URL(base);
  u.searchParams.set("utm_source", "promptbuildr");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
  return u.toString();
}
