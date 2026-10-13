/**
 * First-party traffic attribution: classify a visit by where it came from.
 * Pure + dependency-free so it's easy to test and runs on the edge.
 */

export type Channel =
  | "organic"
  | "ai"
  | "social"
  | "referral"
  | "direct"
  | "internal"
  | "unknown";

export interface ClassifyInput {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  /** Our own host, so self-referrals classify as "internal". */
  selfHost?: string | null;
}

export interface Classification {
  channel: Channel;
  aiSource: string | null;
  referrerHost: string | null;
}

/** host -> canonical AI assistant name. Matched on exact host or subdomain. */
const AI_HOSTS: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "bard.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "claude.ai": "claude",
  "you.com": "you",
  "poe.com": "poe",
  "chat.mistral.ai": "mistral",
  "grok.com": "grok",
  "x.ai": "grok",
  "meta.ai": "meta",
};

/** utm_source values that mean an AI assistant. */
const AI_UTM: Record<string, string> = {
  chatgpt: "chatgpt",
  openai: "chatgpt",
  perplexity: "perplexity",
  gemini: "gemini",
  bard: "gemini",
  copilot: "copilot",
  claude: "claude",
  grok: "grok",
  mistral: "mistral",
  meta: "meta",
  ai: "ai",
};

const SEARCH_HOSTS = [
  "google.",
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  "search.yahoo.com",
  "ecosia.org",
  "baidu.com",
  "yandex.",
  "search.brave.com",
  "startpage.com",
  "qwant.com",
  "kagi.com",
];

const SOCIAL_HOSTS = [
  "t.co",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "lnkd.in",
  "facebook.com",
  "fb.com",
  "l.facebook.com",
  "instagram.com",
  "reddit.com",
  "out.reddit.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "pinterest.com",
  "news.ycombinator.com",
  "substack.com",
  "threads.net",
  "bsky.app",
  "t.me",
  "discord.com",
];

export function hostFromUrl(u?: string | null): string | null {
  if (!u) return null;
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function matchesAny(host: string, list: string[]): boolean {
  return list.some((h) => host === h || host.endsWith("." + h) || host.includes(h));
}

function aiForHost(host: string): string | null {
  for (const [h, name] of Object.entries(AI_HOSTS)) {
    const bare = h.split("/")[0];
    if (host === bare || host.endsWith("." + bare)) return name;
  }
  return null;
}

export function classifyTraffic(input: ClassifyInput): Classification {
  const refHost = hostFromUrl(input.referrer);
  const utmSource = (input.utmSource ?? "").toLowerCase().trim();
  const utmMedium = (input.utmMedium ?? "").toLowerCase().trim();

  // 1. Explicit AI tag via utm_source.
  if (utmSource && AI_UTM[utmSource]) {
    return { channel: "ai", aiSource: AI_UTM[utmSource], referrerHost: refHost };
  }

  // 2. Self-referral => internal navigation.
  const self = (input.selfHost ?? "").replace(/^www\./, "").toLowerCase();
  if (refHost && self && (refHost === self || refHost.endsWith("." + self))) {
    return { channel: "internal", aiSource: null, referrerHost: refHost };
  }

  // 3. AI assistant by referrer host.
  if (refHost) {
    const ai = aiForHost(refHost);
    if (ai) return { channel: "ai", aiSource: ai, referrerHost: refHost };
  }

  // 4. Search engines => organic.
  if (refHost && matchesAny(refHost, SEARCH_HOSTS)) {
    return { channel: "organic", aiSource: null, referrerHost: refHost };
  }

  // 5. Social.
  if (refHost && matchesAny(refHost, SOCIAL_HOSTS)) {
    return { channel: "social", aiSource: null, referrerHost: refHost };
  }

  // 6. Any utm or any other referrer => referral.
  if (utmSource || utmMedium || refHost) {
    return { channel: "referral", aiSource: null, referrerHost: refHost };
  }

  // 7. No referrer, no utm => direct.
  return { channel: "direct", aiSource: null, referrerHost: null };
}
