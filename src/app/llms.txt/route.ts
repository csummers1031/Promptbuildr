import { SITE_URL } from "@/lib/seo";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { taxonomySlug } from "@/lib/feed/taxonomy";

export const dynamic = "force-dynamic";

/** /llms.txt — concise site map for LLM crawlers. */
export async function GET(): Promise<Response> {
  const roleLinks = ROLES.filter((r) => r !== "Other")
    .map((r) => `- [AI prompts for ${r}](${SITE_URL}/prompts/for/${taxonomySlug(r)})`)
    .join("\n");
  const toolLinks = AI_TOOLS.filter((t) => t !== "Other/Any")
    .map((t) => `- [${t} prompts](${SITE_URL}/prompts/tool/${taxonomySlug(t)})`)
    .join("\n");
  const typeLinks = OUTPUT_TYPES.filter((t) => t !== "Other")
    .map((t) => `- [${t} prompts](${SITE_URL}/prompts/type/${taxonomySlug(t)})`)
    .join("\n");

  const body = `# Promptbuildr

> Promptbuildr turns a plain-language task into a high-quality, ready-to-paste AI prompt with setup instructions, tuned for Claude, ChatGPT, Gemini, Copilot, and image tools. Free to use, for business and personal tasks.

## Main pages
- [Build a prompt](${SITE_URL}/)
- [Prompt feed (browse & upvote)](${SITE_URL}/prompts)

## Browse by role
${roleLinks}

## Browse by AI tool
${toolLinks}

## Browse by output type
${typeLinks}

## About
Promptbuildr is powered by Hacking Demand (https://hackingdemand.com). See /llms-full.txt for the full URL list.
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
