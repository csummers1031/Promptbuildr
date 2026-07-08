import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/**
 * OpenNext Cloudflare adapter config. Uses Workers KV as the incremental
 * (ISR) cache — free tier: 100k reads/day, 1k writes/day, ample for taxonomy
 * + feed pages. Bound as NEXT_INC_CACHE_KV in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
