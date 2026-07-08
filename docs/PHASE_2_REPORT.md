# Phase 2 — Builder UI + Data Layer + Deploy Gate: Status Report

**Goal:** the working product — builder form, result page, rate limiting, email gate, DB schema, HubSpot sync (or stub), and a verified Cloudflare/OpenNext deploy path. Plus the monthly spend circuit breaker (your note 5).

## What shipped

| Area | Files |
|---|---|
| Homepage hero + builder form (4 fields, rotating placeholders, mobile-first) | `src/app/page.tsx`, `src/components/BuilderForm.tsx` |
| Result view (prompt-first, copy UX, numbered steps with inline tool links) | `src/components/PromptResult.tsx` |
| Email gate UI | `src/components/EmailGate.tsx` |
| Conditional service CTAs (agent-build vs demand-gen consulting) | `src/lib/cta.ts` |
| Tool-link resolution + instruction linkification | `src/lib/tools/render.ts`, `src/lib/present.ts` |
| HD branding footer | `src/components/Footer.tsx`, `src/config/branding.ts` |
| Drizzle schema (12 tables) + generated migration | `src/db/schema.ts`, `drizzle/0000_*.sql` |
| Neon client (graceful without DATABASE_URL) | `src/db/client.ts` |
| Persistence (generations, prompts, tool_opportunities, moderation, users) | `src/db/repo.ts` |
| Visitor identity + signed cookies (Web Crypto, edge+node) | `src/lib/identity.ts` |
| Rate limiting | `src/lib/rateLimit.ts` |
| Monthly spend circuit breaker | `src/lib/spend.ts` |
| HubSpot CrmSync (real + stub) | `src/lib/crm.ts` |
| API routes | `src/app/api/generate/route.ts`, `src/app/api/email-capture/route.ts` |
| Cloudflare/OpenNext config + bundle gate | `open-next.config.ts`, `wrangler.jsonc`, `scripts/bundle-check.ts` |

## Verification (all green)

- **87 unit tests pass** (added identity, rate-limit, spend, present tests).
- **`pnpm typecheck` clean; `pnpm build` green.**
- **Live smoke test of the whole gate flow** (no DB, cookie-based): 1st anonymous generation → OK + sets cookie; 2nd → email gate; email capture → session cookie; 3rd → unlocked. Personal task correctly returned 0 tools.
- **Cloudflare deploy path verified through bundling:** `pnpm cf:build` produces the Worker; `pnpm cf:bundle-check` (wrangler dry-run, the authoritative size) reports **0.99 MB gzipped vs the 3 MB free-tier limit** — 2 MB headroom. **This satisfies the Phase 2 "builds on Cloudflare via OpenNext" gate.** The only step not done is the *actual* `wrangler deploy`, which needs your Cloudflare account (see below).
- **Design:** clean dark-on-light, mobile-first; you saw the four screenshots. Prompt-first hierarchy, copy button, inline tool links, conditional CTA all rendering from the live model.

## Approved-note coverage

- **Note 5 — spend circuit breaker:** built. Monthly spend tracked in `monthly_spend` (tokens × verified pricing). `MONTHLY_SPEND_CAP` default $50. Thresholds enforced in `rateLimit.ts`: **80%** → warn (digest, Phase 4); **100%** → pause anonymous generations + registered users dropped to 3/day (seed-job pause lands with the cron in Phase 4); **120%** → hard stop for everyone. Without DB the breaker is inert (can't track spend) — production always sets `DATABASE_URL`.
- **Note 4 — off-registry tools:** `tool_opportunities` table + `recordToolOpportunities()` now persist the affiliate-opportunity feed (count, first/last seen, sample prompt ids) whenever DB is present.
- **Note 3 — import script:** unchanged from Phase 1, still the path for your affiliate list.

## Deviations from spec (and why)

1. **Graceful no-DB mode.** The spec assumes a DB from Phase 2. To keep previews working before you've created a Neon account, every DB call no-ops when `DATABASE_URL` is unset: generation works, the cookie-based anonymous gate works, email capture issues a session cookie — only *persistence* and the *spend breaker* pause. With `DATABASE_URL` set, everything enforces fully. No behavior is lost in production; this only makes local/preview dependency-free.
2. **Cost per generation is ~$0.0077**, slightly above the Phase 1 plan estimate (longer outputs). Revised launch total ≈ $15/mo, still far under the $50 cap.
3. **Publish opt-out checkbox** (feed publishing default) is deferred to Phase 3 where the feed itself is built; prompts currently store with `status='published'` so the Phase 3 feed has data.

## What needs YOU (when you're ready — none blocks continuing to Phase 3)

To actually put the site on the public internet, three free accounts + a few secrets:

1. **Neon** (free Postgres) → gives `DATABASE_URL`. I apply the migration (`pnpm db:migrate`).
2. **Cloudflare** (free Workers) → I create a KV namespace (`wrangler kv namespace create NEXT_INC_CACHE_KV`), paste its id into `wrangler.jsonc`, set secrets (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `CRON_SECRET`, `SESSION_SECRET`), and run `pnpm cf:deploy`.
3. **HubSpot** (optional) → `HUBSPOT_ACCESS_TOKEN` turns the CRM stub into real contact sync.

I'll walk each signup click-by-click whenever you want to go live.

## Ready for Phase 3

Phase 3 = public feed (sort/filter/upvote/report/remix) + pre-publication moderation pipeline + promoted-page template + taxonomy pages + sitemaps + structured data + llms.txt + robots.txt AI-crawler allowances + IndexNow + OG images. This is the SEO/growth engine and needs no new accounts from you to build.
