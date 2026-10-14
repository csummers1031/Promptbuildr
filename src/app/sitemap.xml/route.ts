import { SITE_URL } from "@/lib/seo";
import { sitemapIndex, XML_HEADERS } from "@/lib/sitemap";

export const revalidate = 3600;

/** Sitemap index pointing to the split child sitemaps. */
export async function GET(): Promise<Response> {
  const xml = sitemapIndex([
    { loc: `${SITE_URL}/sitemaps/static.xml` },
    { loc: `${SITE_URL}/sitemaps/taxonomy.xml` },
    { loc: `${SITE_URL}/sitemaps/prompts.xml` },
  ]);
  return new Response(xml, { headers: XML_HEADERS });
}
