import { SITE_URL } from "@/lib/seo";
import { urlSet, XML_HEADERS } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const xml = urlSet([
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${SITE_URL}/prompts`, changefreq: "daily", priority: 0.9 },
    { loc: `${SITE_URL}/about`, changefreq: "monthly", priority: 0.5 },
    { loc: `${SITE_URL}/disclosure`, changefreq: "monthly", priority: 0.3 },
    { loc: `${SITE_URL}/privacy`, changefreq: "monthly", priority: 0.3 },
    { loc: `${SITE_URL}/terms`, changefreq: "monthly", priority: 0.3 },
  ]);
  return new Response(xml, { headers: XML_HEADERS });
}
