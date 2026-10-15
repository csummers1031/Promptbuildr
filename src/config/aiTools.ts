/**
 * Where to send a user to actually USE the AI tool they picked. This powers
 * the "Copy & open in [tool]" action (the clear next step after generating a
 * prompt) and the always-present tool link on result/prompt pages.
 *
 * These open the tool's CHAT (so the user can paste), NOT an affiliate/referral
 * link. A referral link lands on a signup page, which is the wrong destination
 * for "open and paste" (and Claude's referral link can expire). Affiliate
 * monetization lives on the "Recommended tools" chips (the registry), not here.
 *
 * - Chat/image tools map to their official web app (deep-links into the app on
 *   mobile when installed, else the web app; no App Store dependency).
 * - "Other/Any" has no single destination, so it returns null and callers show
 *   a small chooser instead.
 */
export type AiToolMode = "chat" | "editor" | "image";

export interface AiToolLaunch {
  /** Display name of the tool. */
  name: string;
  /** URL that opens the tool's web app / chat. */
  href: string;
  /** True only for monetized affiliate links (none here; kept for callers). */
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
 * Official web destinations that open a usable chat/surface. Root or new-chat
 * URLs only (no fabricated deep links). Claude opens a new chat (claude.ai/new)
 * rather than the referral link, which is a signup page and can expire.
 */
const AI_TOOL_WEB: Record<string, { href: string; mode: AiToolMode }> = {
  Claude: { href: "https://claude.ai/new", mode: "chat" },
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
export function aiToolLaunch(aiTool: string): AiToolLaunch | null {
  const entry = AI_TOOL_WEB[aiTool];
  if (!entry) return null;
  return { name: aiTool, href: entry.href, affiliate: false, mode: entry.mode };
}
