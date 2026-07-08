import { SITE_URL } from "@/lib/seo";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { taxonomySlug } from "@/lib/feed/taxonomy";
import { getPromotedSlugs } from "@/db/feed";

export const dynamic = "force-dynamic";

/** /llms-full.txt — the concise map plus every promoted prompt URL. */
export async function GET(): Promise<Response> {
  const promoted = await getPromotedSlugs();
  const promotedLinks = promoted.length
    ? promoted.map((p) => `- ${SITE_URL}/prompts/${p.slug}`).join("\n")
    : "- (none yet)";

  const taxo = [
    ...ROLES.filter((r) => r !== "Other").map((r) => `${SITE_URL}/prompts/for/${taxonomySlug(r)}`),
    ...AI_TOOLS.filter((t) => t !== "Other/Any").map((t) => `${SITE_URL}/prompts/tool/${taxonomySlug(t)}`),
    ...OUTPUT_TYPES.filter((t) => t !== "Other").map((t) => `${SITE_URL}/prompts/type/${taxonomySlug(t)}`),
  ]
    .map((u) => `- ${u}`)
    .join("\n");

  const body = `# Promptbuildr — full URL list

> Promptbuildr turns a plain-language task into a high-quality, ready-to-paste AI prompt with setup instructions. Free, for business and personal use. Powered by Hacking Demand.

## Core
- ${SITE_URL}/
- ${SITE_URL}/prompts

## Taxonomy pages
${taxo}

## Promoted prompt pages
${promotedLinks}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
