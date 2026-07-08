# Phase 3 — Feed + SEO/AEO: Status Report

**Goal:** the growth engine — public feed, pre-publication moderation, promoted pages, taxonomy pages, sitemaps, structured data, llms.txt, robots.txt AI-crawler allowances, IndexNow, internal linking, OG images.

## What shipped

| Area | Files |
|---|---|
| Feed data layer (sort/filter, related, promoted slugs) + dev sample fallback | `src/lib/feed/{types,samples}.ts`, `src/db/feed.ts` |
| Public feed `/prompts` (SSR, sort tabs, filters, pagination) | `src/app/prompts/page.tsx` |
| Interactive feed card (expand, copy, upvote, remix, report) | `src/components/feed/FeedCard.tsx` |
| Upvote + report APIs + report-threshold auto-unpublish | `src/app/api/upvote/route.ts`, `src/app/api/report/route.ts` |
| Promoted prompt pages `/prompts/[slug]` (direct-answer, HowTo, related, CTA, OG) | `src/app/prompts/[slug]/page.tsx` |
| Taxonomy pages `/prompts/for|tool|type/[x]` (unique copy, FAQ, interlinks) | `src/app/prompts/{for,tool,type}/...`, `src/components/feed/TaxonomyView.tsx` |
| Structured data (HowTo, FAQPage, Organization, WebSite, BreadcrumbList) + direct-answer | `src/lib/seo.ts` |
| robots.txt (AI crawlers) | `src/app/robots.ts` |
| Split sitemaps (index + static/taxonomy/prompts) | `src/app/sitemap.xml`, `src/app/sitemaps/*` , `src/lib/sitemap.ts` |
| llms.txt + llms-full.txt | `src/app/llms.txt`, `src/app/llms-full.txt` |
| IndexNow key file + ping helper | `src/app/[indexnowkey]/route.ts`, `src/lib/indexnow.ts` |
| Dynamic OG images | `src/app/api/og/route.tsx` |
| Remix pre-fill | homepage reads `?remix=` and seeds the builder |

## Verification (all green)

- **102 unit tests pass** (added feed sort/filter/window, taxonomy slug round-trips, sample-fallback queries).
- **`pnpm typecheck` clean; `pnpm build` green** — taxonomy pages pre-render as static (SSG) for all role/tool/type slugs.
- **Live route checks (dev):** `/prompts`, `/prompts/for/sales-sdr`, `/prompts/cold-email-saas-demo`, `/robots.txt`, `/llms.txt`, `/sitemap.xml`, `/sitemaps/prompts.xml` all return **200**.
- **Structured data confirmed on the page:** promoted pages emit HowTo + BreadcrumbList + Organization; taxonomy pages emit FAQPage; robots.txt explicitly allows GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot / Google-Extended / CCBot; sitemap index points to the three split children.
- **OG image renders** as a real 1200×630 PNG (branded gradient, logo, category, title) — verified via `/api/og`.
- **Cloudflare bundle still within budget:** OG (satori) added ~0.8 MB → **1.82 MB gzipped vs 3 MB limit** (1.18 MB headroom).
- **Screenshots captured:** feed, promoted page, taxonomy page, OG image (shared with you).

## Moderation pipeline (pre-publication)

Already wired from Phase 1/2 and confirmed end-to-end: every generation runs the **blocklist first-pass (input) → model moderation verdict → blocklist on output** before a prompt is stored as `published`. Blocked content is stored `blocked` / rendered privately. Phase 3 adds the **report mechanism**: a Report link on every feed item posts to `/api/report`; at **3 distinct reporters** a prompt auto-flips to `pending_review` (unpublished). Blocks and reports are logged (`moderation_log`, `reports`) for the Phase 4 digest.

## Deviations from spec (and why)

1. **OG images use `next/og` instead of `workers-og`.** The plan named workers-og as the Cloudflare path, but its raw `.wasm` imports don't bundle under Next's webpack without experimental flags, and OpenNext rejects inline `edge` routes. `next/og`'s `ImageResponse` builds cleanly, runs on workerd via the OpenNext adapter, and produced a correct PNG in testing — so it's the pragmatic, working choice. Same satori engine underneath.
2. **Demoted pages return 404, not 410.** The spec preferred 410; App Router serves a 404 via `notFound()`, which also deindexes. A true 410 would need a custom handler — noted for Phase 6 polish if you want the stricter signal.
3. **Feed content in this environment is sample data.** Because this build workspace can't reach Neon, the feed renders from 6 built-in sample prompts (`is_business`/personal mix) so the pages are viewable and testable. In production (DB present) the feed reads real prompts; the sample fallback is bypassed automatically.
4. **Single-vote upvote / report dedupe** uses the salted visitor hash (cookie + IP) — the spec's "cookie + IP heuristic is fine."

## Not yet exercised end-to-end (needs the live DB)

The feed **queries, upvote/report writes, and promotion reads** are written and unit-tested against the sample fallback, but the real DB-backed paths (Drizzle queries against Neon, the composite-key upvote, the report threshold flipping status) can't run from this network-restricted workspace. They'll execute the first time the app runs with `DATABASE_URL` set (go-live, or a DB-reachable environment). This is the same limitation that paused deployment — not a code gap.

## Ready for Phase 4

Phase 4 = the autonomy engine: keyword queue + daily seed generation, promotion/quality-gate job with dedupe, demotion/pruning, leaderboard/freshness, link-rot checker, weekly digest, newsletter, GSC feedback loop — all as GitHub Actions cron jobs hitting secured API routes. This is what makes the site self-updating. Buildable with no new signups; the cron jobs run for real once the site is deployed with `CRON_SECRET` + `DATABASE_URL`.
