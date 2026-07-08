/** Hacking Demand destination URLs (placeholders until real paths confirmed). */
export const HD = {
  home: "https://hackingdemand.com",
  services: "https://hackingdemand.com/services",
  consulting: "https://hackingdemand.com/consulting",
  marketplace: "https://hackingdemand.com/discount-marketplace",
  blog: "https://hackingdemand.com/blog",
  demandHacks: "https://hackingdemand.com/demand-hacks",
};

export function hdUrl(base: string, campaign: string): string {
  const url = new URL(base);
  url.searchParams.set("utm_source", "promptbuildr");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
  return url.toString();
}
