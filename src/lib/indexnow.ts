import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow — instantly notify Bing/Yandex/others of new or changed URLs.
 * Called from cron jobs on promotion/demotion/taxonomy updates (Phase 4).
 * No-ops when INDEXNOW_KEY is unset.
 */

export function indexNowKey(): string | null {
  return process.env.INDEXNOW_KEY || null;
}

export function keyLocation(key: string): string {
  return `${SITE_URL}/${key}.txt`;
}

export async function pingIndexNow(urls: string[]): Promise<{ ok: boolean; reason?: string }> {
  const key = indexNowKey();
  if (!key) return { ok: false, reason: "no-key" };
  if (urls.length === 0) return { ok: true };

  const host = new URL(SITE_URL).host;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: keyLocation(key),
        urlList: urls.slice(0, 10000),
      }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: `http-${res.status}` };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}
