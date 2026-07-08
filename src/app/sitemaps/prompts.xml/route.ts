import { SITE_URL } from "@/lib/seo";
import { urlSet, XML_HEADERS } from "@/lib/sitemap";
import { getPromotedSlugs } from "@/db/feed";

export const dynamic = "force-dynamic";

/** Only PROMOTED prompts get indexed URLs (small, clean footprint). */
export async function GET(): Promise<Response> {
  const promoted = await getPromotedSlugs();
  const xml = urlSet(
    promoted.map((p) => ({
      loc: `${SITE_URL}/prompts/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
  );
  return new Response(xml, { headers: XML_HEADERS });
}
