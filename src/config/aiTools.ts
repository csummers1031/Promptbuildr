import { getToolBySlug, buildMarketplaceUrl } from "@/config/tools";

/**
 * Where to send a user to actually USE the AI tool they picked. This powers
 * the "Copy & open in [tool]" action (the clear next step after generating a
 * prompt) and the always-present tool link on result/prompt pages.
 *
 * - Claude resolves to the registry affiliate link (monetized).
 * - Every other tool maps to its official web app (no affiliate program, but
 *   we still link it so there's a one-tap path to paste the prompt).
 * - "Other/Any" has no single destination, so it returns null and callers fall
 *   back to a plain Copy button.
 */
export type AiToolMode = "chat" | "editor" | "image";

export interface AiToolLaunch {
  /** Display name of the tool. */
  name: string;
  /** URL that opens the tool's web app. */
  href: string;
  /** True only for monetized affiliate links (currently Claude). */
  affiliate: boolean;
  /**
   * How the user consumes the prompt:
   * - chat: paste into a web chat box (we copy + open the site)
   * - editor: paste inside their IDE (we copy; opening a site doesn't help)
   * - image: paste into an image tool's prompt box (copy + open)
   */
  mode: AiToolMode;
}

/**
 * Official web destinations for tools NOT in the partner registry. Root URLs
 * only (no fabricated deep links).
 */
const AI_TOOL_WEB: Record<string, { href: string; mode: AiToolMode }> = {
  ChatGPT: { href: "https://chatgpt.com/", mode: "chat" },
  Gemini: { href: "https://gemini.google.com/app", mode: "chat" },
  Grok: { href: "https://grok.com/", mode: "chat" },
  DeepSeek: { href: "https://chat.deepseek.com/", mode: "chat" },
  Muse: { href: "https://muse.ai/", mode: "chat" },
  "Microsoft Copilot": { href: "https://copilot.microsoft.com/", mode: "chat" },
  Perplexity: { href: "https://www.perplexity.ai/", mode: "chat" },
  "GitHub Copilot": { href: "https://github.com/copilot", mode: "editor" },
  Cursor: { href: "https://cursor.com/", mode: "editor" },
  "Midjourney/Image AI": { href: "https://www.midjourney.com/", mode: "image" },
  // "Other/Any" intentionally absent -> aiToolLaunch returns null.
};

/** Resolve the launch target for a selected AI tool, or null if there isn't one. */
export function aiToolLaunch(aiTool: string, campaign = "open-in-tool"): AiToolLaunch | null {
  if (aiTool === "Claude") {
    const t = getToolBySlug("claude");
    if (t) return { name: "Claude", href: buildMarketplaceUrl(t, campaign), affiliate: true, mode: "chat" };
  }
  const entry = AI_TOOL_WEB[aiTool];
  if (!entry) return null;
  return { name: aiTool, href: entry.href, affiliate: false, mode: entry.mode };
}
