import { SITE_URL } from "@/lib/seo";
import { urlSet, XML_HEADERS, type SitemapUrl } from "@/lib/sitemap";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { taxonomySlug } from "@/lib/feed/taxonomy";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const urls: SitemapUrl[] = [
    ...ROLES.filter((r) => r !== "Other").map((r) => ({
      loc: `${SITE_URL}/prompts/for/${taxonomySlug(r)}`,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
    ...AI_TOOLS.filter((t) => t !== "Other/Any").map((t) => ({
      loc: `${SITE_URL}/prompts/tool/${taxonomySlug(t)}`,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
    ...OUTPUT_TYPES.filter((t) => t !== "Other").map((t) => ({
      loc: `${SITE_URL}/prompts/type/${taxonomySlug(t)}`,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
  ];
  return new Response(urlSet(urls), { headers: XML_HEADERS });
}
