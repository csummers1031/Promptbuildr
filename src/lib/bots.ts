/**
 * Best-effort bot detection for first-party analytics beacons. JS-executing
 * crawlers (Googlebot, headless renderers, some AI fetchers) run the client
 * beacons and would otherwise inflate visit/view counts. We only use this to
 * decide whether to RECORD analytics, never to block content, so a false
 * positive just means an undercount (the safe direction).
 */
const BOT_UA =
  /bot\b|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|preview|pinterest|headless|lighthouse|phantom|puppeteer|playwright|gptbot|claudebot|ccbot|perplexity|google-extended|bingpreview|baiduspider|yandex|duckduckbot|applebot|semrush|ahrefs|dotbot|mj12bot/i;

export function isBotRequest(headers: Headers): boolean {
  // Cloudflare marks known-good bots it has verified.
  if ((headers.get("cf-verified-bot") || "").toLowerCase() === "true") return true;
  const ua = headers.get("user-agent") || "";
  if (!ua) return true; // a beacon with no UA is almost always a script/bot
  return BOT_UA.test(ua);
}
