/**
 * Rate limiting for the public MCP endpoint. Two independent gates:
 *
 *  1. Global spend circuit breaker — reuses the web app's monthly spend tracker.
 *     Once the shared API budget hits the "cap" level (anonymous traffic is
 *     paused on the web at the same point), the public MCP stops generating.
 *
 *  2. Per-IP hourly cap via Cloudflare KV. The MCP has no accounts, so this is
 *     the abuse ceiling. It falls OPEN when KV is unavailable (local dev, tests,
 *     non-Cloudflare runtime) so the endpoint still works off-platform.
 *
 * The KV counter is a read-then-write increment (not atomic); for a soft abuse
 * ceiling the occasional lost increment under burst is acceptable.
 */
import { getSpendState } from "@/lib/spend";

const HOURLY_LIMIT = 30;

export interface RateLimitResult {
  ok: boolean;
  reason?: string;
}

interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** Resolve the Cloudflare KV binding at runtime, or null when not on Cloudflare. */
async function getKv(): Promise<KvLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: Record<string, unknown> | undefined;
    try {
      env = getCloudflareContext().env as unknown as Record<string, unknown>;
    } catch {
      env = (await getCloudflareContext({ async: true })).env as unknown as Record<string, unknown>;
    }
    const kv = env?.NEXT_INC_CACHE_KV as KvLike | undefined;
    return kv ?? null;
  } catch {
    return null;
  }
}

export async function checkMcpRateLimit(ipHash: string, now: Date): Promise<RateLimitResult> {
  // Gate 1: shared monthly budget. Fail open if the spend DB is unreachable.
  try {
    const spend = await getSpendState(now);
    if (spend.level === "cap" || spend.level === "hardstop") {
      return {
        ok: false,
        reason:
          "The public Promptbuildr MCP has reached its shared monthly budget. " +
          "It resets next month. For unlimited use, self-host the server with your own Anthropic key.",
      };
    }
  } catch {
    // ignore — the per-IP gate still applies
  }

  // Gate 2: per-IP hourly cap. Fail open when KV is unavailable.
  const kv = await getKv();
  if (!kv) return { ok: true };

  try {
    const hour = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const key = "mcprl:" + ipHash + ":" + hour;
    const raw = await kv.get(key);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    if (count >= HOURLY_LIMIT) {
      return {
        ok: false,
        reason:
          "Rate limit reached (" + HOURLY_LIMIT + " generations per hour). " +
          "Try again shortly, or self-host for unlimited use.",
      };
    }
    await kv.put(key, String(count + 1), { expirationTtl: 3600 });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
