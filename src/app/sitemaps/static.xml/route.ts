import { SITE_URL } from "@/lib/seo";
import { urlSet, XML_HEADERS } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const xml = urlSet([
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${SITE_URL}/prompts`, changefreq: "daily", priority: 0.9 },
  ]);
  return new Response(xml, { headers: XML_HEADERS });
}
