# Promptbuildr — Handoff & Session Memory

> Living source of truth. A fresh session should read this FIRST.
> Last updated: 2026-10-13 (launch night).

---

## 🟢 Current state (as of 2026-10-13)

- **LIVE** at **https://promptbuildr.ai** and **https://www.promptbuildr.ai** (HTTPS enforced).
- Hosting: **Cloudflare Workers** (OpenNext adapter). Worker name: `promptbuildr`.
- Repo: `csummers1031/Promptbuildr`, working branch **`claude/promptbuildr-build-plan-pxgurw`** (auto-deploys on push via `.github/workflows/deploy.yml`).
- **16 deploys, all green** (deploy #3 was cancelled and replaced by #4 — ignore).
- Staging URL still works: `promptbuildr.charles-7a8.workers.dev`.

### Infra
- **DB:** Neon Postgres. `DATABASE_URL` IS set on the Worker (pushed by CI). Spend circuit breaker is therefore ACTIVE. `MONTHLY_SPEND_CAP=50` (graduated: warn 80%, clamp 100%, hard-stop 120% ≈ $60).
- **AI model:** `claude-haiku-4-5` (~$0.0077/generation).
- **Cache:** Cloudflare KV `NEXT_INC_CACHE_KV` = `b2c3f79ce93845c9aa7aa549fa27ce31`.
- **Certs:** Universal + Advanced (ACM) active for apex + `*.promptbuildr.ai`. "Always Use HTTPS" = ON.

---

## 📈 Launch-night signal (first ~hours)
- ~18 pageviews (12 apex, 1 www, 5 staging), ~4.4 min avg time on page.
- **$30 in Claude referral credits** earned (3× $10) — the Claude referral link is converting.
- Google is already **citing the site** in search.

---

## ‼️ STANDING REQUIREMENTS from Charles (do these — agreed)
1. **Full change log.** A living `CHANGELOG.md` recording EVERY change — code AND settings (Cloudflare, DNS, SSL, env secrets, GSC, HubSpot, 3rd-party). Each entry: UTC timestamp, what, category, commit+deploy#, who, one-line why. Purpose: if traffic falls off a cliff, trace the cause fast. Backfill tonight's launch changes as the first entries.
2. **Full traffic attribution** — know every source of traffic: **term, source, AI**, etc. Plan:
   - First-party visit logging to the DB (referrer, utm_source/medium/campaign/term/content, landing page, classified channel: Organic / Direct / Social / Referral / **AI Assistant** — detect ChatGPT/Perplexity/Gemini/Copilot/Claude). Build a report.
   - Google Search Console for organic **search terms** (the only source of query data).
   - Honest caveat: many AI apps strip referrers → some AI traffic shows as "Direct." Capture what's detectable; UTM-tag our own links.

**Next session, FIRST actions (once changes are allowed):** create `CHANGELOG.md` (backfilled) and build the attribution logging. Charles confirmed this plan is right.

---

## 🔑 Access status (what Claude can/can't reach)
| Have | Scope |
|---|---|
| GitHub | read/write, deploy logs, push → deploy |
| HubSpot connector | portal 23513958 — CRM + content analytics (pageviews) |
| Cloudflare **Developer Platform** connector | Workers/KV/D1/R2 ONLY — **no DNS/SSL/zone/custom-domain** tools |

**NOT reachable:** Cloudflare DNS/SSL/zone settings, Google Search Console, any affiliate partner portal (Instantly/Apollo/etc. — separate dashboards, no connectors).

**To give Claude full Cloudflare control (pending — Charles setting up a scoped token):**
- Create a Cloudflare API token scoped to zone `promptbuildr.ai`: **Zone→DNS:Edit, Zone→SSL and Certificates:Edit, Zone→Zone Settings:Edit, Zone→Zone:Read, Account→Workers Scripts:Edit, Zone→Workers Routes:Edit**.
- Add as **environment secrets** (not GitHub secrets): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Allow **`api.cloudflare.com`** in environment Network access.
- New session to pick up. (GitHub Actions secrets are NOT readable by the interactive session — that's why a separate env secret is needed.)
- Note: this sandbox's outbound is proxy-gated; arbitrary hosts (incl. the live site + api.cloudflare.com) are blocked unless allow-listed.

---

## 🧩 Key product facts
- **Tool registry:** 44 affiliate partners (`src/config/tools.data.json`). Promptbuildr-specific **partner tracking links** (NOT routed through hackingdemand.com, except HubSpot which keeps its marketplace page).
- `buildMarketplaceUrl()` appends UTMs **only** to `hackingdemand.com` URLs; partner tracking links pass through verbatim.
- **Claude referral link** = `claude.ai/referral/VBG0kPVoSQ?s=ios`. **Capped at 3 referrals/month (~$30)** — maxed on launch night. It's a bonus, NOT the revenue engine. Real revenue = uncapped partners (Instantly/Apollo/n8n/etc.) → needs TRAFFIC.
- Affiliate anchors all carry `rel="sponsored noopener noreferrer"`. Inline linking gated to business prompts (personal = ad-free).
- Loading-screen offers tuned to earning partners only (`src/lib/offers.ts`), gated to business tasks.
- FTC **affiliate disclosure** live at `/disclosure` + footer.
- **Source of truth for links going forward:** Google Sheet "Affiliate Partner Master Registry (MASTER)", column `promptbuildr_destination`.

### HubSpot
- Tracking pixel (portal 23513958) is LIVE site-wide.
- **CRM contact sync is OFF** — no `HUBSPOT_ACCESS_TOKEN` secret set. To enable: add it as a GitHub Actions secret, redeploy.
- Collected Forms (non-HubSpot form capture) is the pixel-based alternative — NOT yet verified working. The email gate is a real `<form>` with `type=email` + submit, so it has a chance; risk is the form is dynamically injected. Test: submit a real email on the live site, then check HubSpot Contacts.

### Google Search Console
- Domain property **verified** (DNS TXT, "Domain name provider").
- Sitemap `https://promptbuildr.ai/sitemap.xml` submitted. Showed **"Couldn't fetch"** — this is the normal transient first-submit state; the sitemap IS serving valid XML (confirmed in browser: it's a sitemap index → static.xml, taxonomy.xml, prompts.xml). Expect it to flip to "Success" within ~24–48h.

---

## 📋 Open backlog (post-launch)
- **BUG: feed/prompt view counts never increment.** `view_count` is displayed (FeedCard, feed) but no code increments it (grep found no update/recordView logic). Decide what counts as a view (open prompt page? expand card?) and wire it. Reported by Charles (views don't tick up on mobile).
- **Confirm email capture.** HubSpot shows 0 promptbuildr contacts, but real captures land in Neon `users` table (not readable without DB access). Get `DATABASE_URL` into env (or a tiny admin readout) to report captured emails + exact monthly spend.
- **Autonomy engine** (cron jobs): auto-promote winning prompts → SEO pages, demote reported/low-quality, trending refresh, link-rot checker, weekly digest, GSC ping. (`CRON_SECRET` already set.)
- **Turnstile** bot protection on Generate (spend cap already bounds worst case to ~$60/mo).
- **Cookie-consent banner** (HubSpot cookies; EU/UK) — can enable in HubSpot.
- **HubSpot CRM token** to turn on contact sync.
- **Offer strip on the result page** (business tasks) — more dwell time than the loading flash.
- **First-party outbound-click tracking** — log affiliate link clicks to the DB so we see which partners get clicked without logging into 40+ dashboards.
- Reconcile links from the MASTER Google Sheet when there's a batch of changes.
- Non-earning plain-homepage tools (no affiliate program yet): pipedrive, attio, clay, vercel, cloudflare, zapier, notion, google-analytics-4, posthog, ahrefs, semrush, canva, cloudways, figma — upgrade to tracking links if/when Charles joins those programs.

---

## 🛠️ Dev notes
- `pnpm install` then: `pnpm exec tsc --noEmit`, `pnpm exec vitest run` (114 tests), `pnpm exec next build`.
- Fresh container needs `pnpm install` first (node_modules not committed).
- Local `next start` can OOM in the sandbox; kill stray servers before retrying.
- Chromium for screenshots: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (run scripts from repo root so `playwright` resolves).
- `.env` is gitignored; secrets live in GitHub Actions + the Worker. `.env.example` lists them.
