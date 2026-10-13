# Changelog

Append-only log of **every** change — code AND settings — so if traffic moves, we can trace why.
Newest first. Format: `UTC date · category · what · why · ref`.
Categories: `code` `cloudflare` `dns` `ssl` `env` `gsc` `hubspot` `3rd-party`.

Settings changes Claude makes (once it has Cloudflare access) are logged here automatically;
settings Charles changes in a dashboard should be added here too (or Claude logs them when it detects them).

---

## 2026-10-13 — Foundation build (Tier 0–3)

> **REVERT BASELINE: commit `0a221b5`** = site state immediately BEFORE the foundation build
> (10 indexable pages, promotion pipeline unbuilt). Roll back here if the build regresses:
> `git checkout -B claude/promptbuildr-build-plan-pxgurw 0a221b5` (local tag `foundation-baseline`
> pins it; remote tag push is blocked by the scoped token, so the SHA is the source of truth).
> Each tier below ships as its own commit/deploy so a partial revert is possible.

- `code`/`seo` · **Tier 0 + 3 — promotion engine (the compounding flywheel).** New: `src/db/promote.ts` (promote/demote + quality gate + normalized-title dedup, no DDL — updates existing columns only), `src/lib/feed/slug.ts` + `quality.ts` (slug gen + page-worthiness scoring, `PROMOTE_MIN_SCORE=50`, min 120-char body), `src/lib/cron/auth.ts` (Bearer CRON_SECRET), `/api/cron/promote` + `/api/cron/demote` routes, `recordCronRun` logging. Generated prompts now **auto-promote inline** when they clear the gate (assign slug + `promoted_at`, ping IndexNow → Bing) so each good prompt becomes an indexable page instantly. `.github/workflows/cron.yml` runs a promote backstop every 6h + daily demote (deindexes pages with ≥3 reports). Taxonomy pages switched to ISR (`revalidate=3600`) so new pages surface without a redeploy. Validated vs live data: all 11 un-promoted prompts qualify → indexable surface 10→21, then grows with traffic. +12 tests (134 total, green). Ref: deploy #21 (pending).

- `code`/`seo` · **Tier 1 — host canonicalization.** New `src/middleware.ts`: `www.promptbuildr.ai`→apex 301 (preserves path+query); `*.workers.dev` staging served but `X-Robots-Tag: noindex,nofollow`. Added self-canonical to the home page. Why: www/apex/staging were serving identical content as 3 indexable hosts, splitting ranking signal. Build verified (middleware 34.2 kB), 122 tests green. Ref: deploy #20 (pending).

- `code` · **Updated 13 affiliate tracking links** to new Promptbuildr-specific partner links (Apollo, Lemlist, Hotjar/Contentsquare, Beefree, Databox, Reclaim, Smartlead, Rytr, Synthesia, Hunter, UpLead, Stripo, Fireflies). Source of truth: MASTER sheet col D (`promptbuildr_destination`). Other 31 tools unchanged; 44 total. Rules verified: UTMs only on hackingdemand.com (gated in `buildMarketplaceUrl`), partner links pass through verbatim, `rel="sponsored noopener noreferrer"` on all anchors. 122 tests green. Why: route affiliate clicks through Promptbuildr-specific tracking so partner revenue is attributable to the site.
- `3rd-party` · **Connected native Neon connector** (read/write SQL to project `cold-tooth-25808362`). Claude can now query live Promptbuildr data (visits/generations/users/outbound_clicks) directly for attribution readouts.
- `cloudflare` · **Gained full Cloudflare zone/DNS/SSL API access** via a scoped API token (network secret; `api.cloudflare.com` allow-listed). Verified read of zone `promptbuildr.ai`, DNS records, SSL=Full, Always-Use-HTTPS=on. Claude can now manage DNS/SSL/zone settings directly. Why: standing requirement to trace/fix infra without waiting on dashboard screenshots.
- `env` · **Fixed the environment Setup script** to a no-op (`#!/bin/bash` + `true`). The prior `npm install` failed because the script runs from `/home/user` (not the repo at `/home/user/Promptbuildr`) → no package.json. Deps are installed in-session. Why: new sessions were failing to boot.
- `3rd-party` · **Verified HubSpot email capture works.** Confirmed a Promptbuildr form submission (first-touch URL `https://promptbuildr.ai/`) reached HubSpot portal 23513958 (1 contact, a test). Caveat: that portal is the shared HackingDemand DB (~5,581 contacts) — Neon is the clean Promptbuildr measure.
- `code` · **Fixed prompt view counts never incrementing.** New `/api/view` + client beacon (deduped per session): opening a feed card or a promoted-prompt page now counts a view, updates `prompts.view_count` + `prompt_daily_stats`, and ticks the feed number up live. Why: views were displayed but never recorded. Ref: deploy #18 (pending).
- `code` · **Added first-party traffic attribution** (visits + outbound-click logging, classifier, `/api/track/*`, client beacon, `data-track` on money links, report queries in `docs/ANALYTICS.md`). Why: know every traffic source (source/term/AI/clicks) and never guess attribution again. Ref: deploy #17 (pending).
- `code` · Started this CHANGELOG and `docs/HANDOFF.md` session memory. (docs-only, `[skip ci]`)
- `cloudflare`/`ssl` · **Enabled "Always Use HTTPS"** (Charles, dashboard). Why: clear the ⚠️ not-secure warning; force http→https.
- `cloudflare`/`dns` · **Attached `www.promptbuildr.ai`** as a 2nd Worker custom domain. Why: www was NXDOMAIN. Ref: deploy #16.
- `code` · Fixed hero hidden under sticky header (scroll-padding-top). Ref: deploy #15.
- `code` · Added favicon (ico + apple-icon) + made page headers sticky. Ref: deploy #14.
- `code`/`dns` · **WENT LIVE on `promptbuildr.ai`** (attached apex custom domain) + added FTC `/disclosure`. Ref: deploy #13.
- `code` · Linkified instructions in feed + prompt pages (all money links now `rel="sponsored"`). Ref: deploy #12.
- `code` · Link registry tools mentioned anywhere in instructions. Ref: deploy #11.
- `code` · Tuned loading-screen offers to earning partners only. Ref: deploy #10.
- `code` · Switched affiliate links to Promptbuildr-specific partner tracking links; added 11 partners (44 total); UTMs only on hackingdemand.com. Ref: deploy #9.
- `code` · (earlier) HubSpot tracking pixel site-wide, AI-tool dropdown expansion + category pages, Claude referral link, loading-screen offers, share mechanics. Ref: deploys #5–#8.

### Notable settings / external (not in git)
- `env` · Worker runtime secrets set via CI: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `INDEXNOW_KEY`, `MONTHLY_SPEND_CAP=50`. `HUBSPOT_ACCESS_TOKEN` NOT set (CRM sync off).
- `gsc` · Domain property `promptbuildr.ai` verified (DNS TXT); sitemap `https://promptbuildr.ai/sitemap.xml` submitted.
- `cloudflare` · Worker `promptbuildr`; KV `NEXT_INC_CACHE_KV`; certs active for apex + `*.promptbuildr.ai`.
