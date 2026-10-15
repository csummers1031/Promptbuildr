/**
 * Promptbuildr maintenance cron Worker.
 *
 * Cloudflare invokes scheduled() on the cron schedule in wrangler.jsonc. Each
 * run calls the app's authenticated maintenance endpoints:
 *   - /api/cron/demote  : deindex pages that crossed the user-report threshold
 *   - /api/cron/promote : backstop-promote anything that qualifies
 * Both are idempotent and protected by CRON_SECRET (sent as a Bearer token).
 *
 * A Bearer-protected fetch() handler is included so the jobs can also be
 * triggered manually for verification.
 */
const BASE = "https://promptbuildr.ai";
const JOBS = ["/api/cron/demote", "/api/cron/promote"];

async function runJobs(env) {
  const results = {};
  for (const path of JOBS) {
    try {
      const res = await fetch(BASE + path, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
      const body = await res.text();
      results[path] = { status: res.status, body: body.slice(0, 500) };
      console.log("cron", path, res.status);
    } catch (e) {
      results[path] = { error: String(e) };
      console.error("cron", path, "failed:", e);
    }
  }
  return results;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runJobs(env));
  },

  async fetch(req, env) {
    const auth = req.headers.get("authorization") || "";
    if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
      return new Response("unauthorized", { status: 401 });
    }
    const results = await runJobs(env);
    return Response.json(results);
  },
};
