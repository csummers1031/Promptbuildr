import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * OpenNext Cloudflare adapter config.
 * - incrementalCache: Workers KV (bound as NEXT_INC_CACHE_KV in wrangler.jsonc).
 * - queue: the memory queue actually PERFORMS ISR revalidation. Without a queue
 *   the default is the "dummy" queue, so `export const revalidate` never fires:
 *   demoted pages never refresh to 404 and new content never surfaces between
 *   deploys. The memory queue requires the WORKER_SELF_REFERENCE service binding
 *   (see wrangler.jsonc) so it can re-request the route to regenerate it.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
});
