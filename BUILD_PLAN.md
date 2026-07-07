# Promptbuildr.ai — Build Plan

**Status:** Awaiting approval. No application code has been written. This document covers the four items requested for review — database schema, routes, meta-prompt draft, and phase breakdown — plus the stack decisions the spec asked me to state and flag.

---

## 1. Stack Decisions

### 1.1 Database: Neon Postgres (chosen over Supabase)

**Why Neon:**
- **No keep-alive hack needed.** Neon's free tier scales to zero but wakes automatically on the next connection (~500ms cold start on a cron hit is harmless). Supabase free tier *pauses the whole project* after 7 days of inactivity and requires a keep-alive cron — a workaround Neon simply doesn't need.
- **Cloudflare Workers compatibility.** Workers cannot open raw TCP Postgres connections. Neon's `@neondatabase/serverless` driver speaks HTTP/WebSockets natively and is the reference driver for Postgres-on-Workers. (Supabase's pooler also works, but Neon's driver is the cleanest fit.)
- **Free tier permits commercial use** (0.5 GB storage, ~190 compute-hours/month — far beyond this app's needs; the entire dataset is text rows).

**ORM:** Drizzle. Edge-compatible with the Neon HTTP driver, fully typed, zero runtime cost, free. Migrations via `drizzle-kit` committed to the repo and applied from CI.

### 1.2 Hosting: Cloudflare Workers via `@opennextjs/cloudflare`

Target is the current OpenNext Cloudflare adapter (Cloudflare has consolidated Pages into Workers; the adapter deploys a Worker + static assets). **Known incompatibilities and workarounds, as required by the spec:**

| Next.js feature | Status on Cloudflare | Workaround |
|---|---|---|
| `next/image` optimization | Not available on free tier (Cloudflare Image Resizing is paid) | `images: { unoptimized: true }`. The site is text-first; the only images are OG images (generated, not optimized) and small static assets we pre-optimize at build time. No real loss. |
| `@vercel/og` / `ImageResponse` | Vercel-specific runtime | Use `workers-og` (satori + resvg-wasm compiled for workerd) in the `/api/og` route. Same satori templates, different wrapper. |
| ISR / revalidation cache | Needs an incremental-cache binding | Bind Workers KV (free tier: 100k reads/day, 1k writes/day — ample) as the OpenNext incremental cache. Taxonomy and feed pages use short-TTL ISR; promoted pages revalidate on-demand from the cron jobs. |
| Node APIs | Mostly supported via `nodejs_compat` flag | Keep dependencies lean; avoid `fs`-at-runtime libraries. |
| **Worker bundle size** | **3 MB gzipped on free tier** | This is the real constraint. Mitigation: Drizzle + Neon driver + Anthropic SDK are all small; no heavy server deps; resvg-wasm is the largest single item (~1.2 MB) and stays within budget. Bundle size check added to CI as a phase gate. |

Deploy target stays swappable: all Cloudflare-specific code is isolated to `open-next.config.ts`, `wrangler.jsonc`, and the OG route. Nothing else knows where it runs.

### 1.3 AI model

**Verified against platform.claude.com docs (2026-07-07):** `claude-3-5-haiku` was **retired on 2026-02-19** and Haiku 3 is deprecated (retires 2026-04-19). The only current Haiku is **Claude Haiku 4.5**. `ANTHROPIC_MODEL` env var therefore defaults to **`claude-haiku-4-5`** — $1.00/M input, $5.00/M output, 200K context, 64K max output. Server-side only; the key never ships to the client.

Haiku 4.5 also supports **structured outputs** (`output_config.format` with a JSON schema), which guarantees schema-valid JSON from the generation call. We use that as the primary path and keep the spec's defensive parse/retry as a safety net.

**API cost model (verified pricing):** one generation ≈ 1,800 input tokens (meta-prompt + tool registry + user input) + 900 output tokens ≈ **$0.0063/generation** (~26% above the original Haiku 3.5 estimate). A quality-score call ≈ $0.002.

| Autonomous feature | Volume | Est. monthly cost |
|---|---|---|
| Daily seed generation | 10/day | ~$1.90 |
| Quality-gate scoring | ~70/week | ~$0.60 |
| User generations (early traffic, ~50/day avg) | 1,500/mo | ~$9.45 |
| Retries + moderation overhead (~10%) | — | ~$1.20 |
| **Total at launch scale** | | **~$13/mo, dominated by real usage** — well under the $50 default `MONTHLY_SPEND_CAP` |

Everything else in the stack is $0: Cloudflare free tier, Neon free tier, GitHub Actions (public repo or well within free minutes), HubSpot free CRM + marketing email, GA4/GSC/Bing/IndexNow.

### 1.4 Cron: GitHub Actions

Scheduled workflows `curl` secured API routes with an `x-cron-secret` header checked against `CRON_SECRET`. Each workflow fails the run (and GitHub emails you) if the route returns non-200 — that plus the digest satisfies "fail loudly." Every job writes a row to `cron_runs` for idempotency (a job checks whether it already ran for its period before doing work) and for the digest.

---

## 2. Database Schema

Drizzle/Postgres. Enums shown inline for readability.

```
users
  id              uuid PK
  email           text UNIQUE NOT NULL
  role            text NOT NULL              -- dropdown value
  created_at      timestamptz
  hubspot_contact_id  text NULL              -- set once synced
  hubspot_synced_at   timestamptz NULL
  categories_used     text[] DEFAULT '{}'    -- accumulated, pushed to HubSpot

prompts
  id              uuid PK
  slug            text UNIQUE NULL           -- set only when promoted
  title           text NOT NULL
  prompt_text     text NOT NULL
  instructions    jsonb NOT NULL             -- string[]
  recommended_tools  text[] DEFAULT '{}'     -- slugs, validated against config
  category_tags   text[] DEFAULT '{}'
  role            text NOT NULL              -- form field 2
  ai_tool         text NOT NULL              -- form field 3
  output_type     text NOT NULL              -- form field 4
  task_input      text NOT NULL              -- raw "what are you trying to do"
  is_business     boolean NOT NULL
  is_agent_or_automation  boolean NOT NULL
  source          enum('user','seed') NOT NULL
  user_id         uuid NULL REFERENCES users
  status          enum('published',          -- visible in feed
                       'private',            -- opt-out or anonymous pre-email; visible to creator only
                       'blocked',            -- failed moderation; visible to creator only
                       'pending_review')     -- auto-unpublished by report threshold
  moderation      jsonb NULL                 -- verdict object from the generation call
  quality_score   smallint NULL              -- 1–10, seeded prompts only
  promoted_at     timestamptz NULL           -- non-null = has dedicated page
  demoted_at      timestamptz NULL           -- non-null = page 410s
  upvote_count    int DEFAULT 0              -- denormalized, cron-reconciled
  view_count      int DEFAULT 0
  created_at / updated_at  timestamptz

upvotes
  prompt_id       uuid REFERENCES prompts
  visitor_hash    text                       -- hash(cookie id + ip)
  created_at      timestamptz
  PRIMARY KEY (prompt_id, visitor_hash)      -- enforces 1 vote/visitor

reports
  id, prompt_id, reason text, visitor_hash, created_at
  -- >= 3 distinct visitor_hashes on a prompt → status = 'pending_review'

generations                                   -- rate limiting + history
  id              uuid PK
  user_id         uuid NULL
  ip_hash         text NOT NULL
  prompt_id       uuid NULL                  -- null if generation errored
  created_at      timestamptz
  INDEX (ip_hash, created_at), INDEX (user_id, created_at)

keyword_queue
  id              serial PK
  topic           text NOT NULL
  role            text NOT NULL              -- persona to generate as
  output_type     text NOT NULL
  is_business     boolean NOT NULL           -- for the 60/40 mix
  status          enum('pending','used','failed') DEFAULT 'pending'
  used_at         timestamptz NULL
  created_at      timestamptz
  source          enum('manual','initial_seed','gsc') DEFAULT 'initial_seed'

moderation_log
  id, prompt_id NULL, stage enum('blocklist','model'), reason text,
  matched_pattern text NULL, created_at

prompt_daily_stats                            -- feeds leaderboards + demotion
  prompt_id, date, views int, upvotes int
  PRIMARY KEY (prompt_id, date)

link_checks
  tool_slug, url, status_code, ok boolean, checked_at
  -- latest row per slug drives fallback/removal

cron_runs
  id, job_name, period_key text,             -- e.g. '2026-07-07' — idempotency key
  status enum('ok','failed'), detail jsonb, started_at, finished_at
  UNIQUE (job_name, period_key)
```

Denormalized `upvote_count`/`view_count` keep the feed query to a single indexed select; the daily leaderboard job reconciles them from `upvotes`/`prompt_daily_stats`.

---

## 3. Routes

### Pages (all server-rendered)

| Route | Purpose | Indexed? |
|---|---|---|
| `/` | Hero with builder embedded, generation counter, top prompts this week | Yes |
| `/prompts` | Public feed: sort tabs (Top Today/Week/Month/All-Time, Newest), filters (role/tool/type), in-place expansion, upvote/copy/remix | Yes (feed page itself; items are not URLs) |
| `/prompts/[slug]` | Promoted prompt pages only. Direct-answer summary, `<pre>` prompt, HowTo schema, related prompts, contextual HD link, OG image. Demoted slugs return **410** | Yes |
| `/prompts/for/[role]` | Taxonomy: unique intro copy, filtered feed, links to promoted pages, FAQPage schema | Yes |
| `/prompts/tool/[ai-tool]` | Same, per AI tool | Yes |
| `/prompts/type/[output-type]` | Same, per output type | Yes |
| `/about`, `/privacy`, `/terms` | Static | Yes |
| `/llms.txt`, `/llms-full.txt` | LLM crawler navigation | n/a |
| `/robots.txt` | Explicitly allows GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot | n/a |
| `/sitemap.xml` → `/sitemaps/prompts.xml`, `/sitemaps/taxonomy.xml`, `/sitemaps/static.xml` | Split sitemap index | n/a |
| `/{INDEXNOW_KEY}.txt` | IndexNow key file | n/a |

### API routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/generate` | POST | Rate-limit middleware | Validates form → blocklist pre-check on input → Anthropic call → defensive JSON parse (strip fences, retry once) → moderation verdict → insert prompt → return result. Sets anonymous-use cookie. |
| `/api/email-capture` | POST | — | Email + role → upsert user, issue signed session cookie, HubSpot sync (or stubbed `CrmSync` interface) |
| `/api/upvote` | POST | Visitor hash | Insert-or-ignore into `upvotes` |
| `/api/report` | POST | Visitor hash | Insert report; auto-unpublish at threshold |
| `/api/og` | GET | — | Satori OG image (title + category on branded template), edge-cached |

### Cron routes (all: `x-cron-secret` header, idempotent via `cron_runs`, non-200 on any failure)

| Route | Schedule | Job |
|---|---|---|
| `/api/cron/seed` | Daily | Pull 5–10 `pending` keywords → full generation + moderation pipeline → publish as "Promptbuildr Team" |
| `/api/cron/promote` | Daily | Promote user prompts ≥ upvote threshold (config, start 5) or weekly Top-10; seeded prompts by quality score ≥ 8 (second Haiku call), capped N/week; near-duplicate check (normalized-title trigram similarity — see §6) before any promotion; re-run moderation; generate slug + page; update sitemap; ping IndexNow |
| `/api/cron/demote` | Weekly | Revert promoted pages with zero views/impressions after 90 days → 410 + sitemap update + IndexNow |
| `/api/cron/leaderboard` | Daily | Reconcile counts, recompute Top windows, bump taxonomy `dateModified` only when contents actually changed |
| `/api/cron/linkcheck` | Weekly | HEAD-check every tools-config URL + HD links; swap to fallback/remove on failure; log for digest |
| `/api/cron/gsc-loop` | Weekly | (Hook now, wire later) Pull GSC queries with impressions but no matching page → append to `keyword_queue` with `source='gsc'` |
| `/api/cron/digest` | Weekly | Email to you: feed volume, promotions/demotions, moderation blocks (count + top reasons), reports, quality-gate rejection rate, top prompts, links fixed, GSC movers, **estimated API spend** |
| `/api/cron/newsletter` | Weekly | "Top 5 prompts this week" to captured list via HubSpot marketing email API, marketplace links + unsubscribe |

### Rate limiting (`/api/generate`)

1. **Anonymous:** 1 lifetime generation, enforced by signed cookie **and** `generations.ip_hash` lookup (either trips the gate). Friction, not security — per spec.
2. **Email-captured:** signed session cookie → 15/day per account **and** 30/day per IP hash (catches multi-account-per-IP scraping), enforced server-side against `generations`.
3. Global circuit breaker: if total generations in the last hour exceeds a config ceiling, `/api/generate` returns 503 and the digest flags it — caps worst-case API spend from an evasion attack.

---

## 4. Meta-Prompt Draft (v1 — Phase 1 evals will iterate on this)

System prompt for the generation call. `{{...}}` are server-injected.

```
You are the prompt-engineering engine behind Promptbuildr, a tool that turns a
plain-language task description into a high-quality, ready-to-paste AI prompt.

USER CONTEXT
- Task: {{task}}
- Who they are: {{role}}
- Target AI tool: {{ai_tool}}
- Desired output type: {{output_type}}

AVAILABLE TOOL REGISTRY (the ONLY tools you may recommend, by slug):
{{tools_registry}}   <!-- slug: one-line description, one per line -->

YOUR JOB
Write the best prompt a skilled prompt engineer would write for this task, then
explain how to use it. Apply these practices:
1. Clear task definition: open the prompt with an unambiguous statement of what
   the AI must produce, for whom, and to what standard.
2. Context injection: include labeled placeholders in [SQUARE BRACKETS] for the
   specifics only the user knows (their product, audience, dates, constraints).
   Never invent fake specifics. Keep placeholders few and obviously named.
3. Role/persona framing when it genuinely improves output, not as boilerplate.
4. Explicit constraints: length, tone, format, what to avoid.
5. Explicit output format: tell the AI exactly how to structure its response.
6. Tool-appropriate syntax: for Claude, use XML tags to delimit sections
   (<context>, <task>, <output_format>); for ChatGPT/Gemini/Copilot, use clear
   markdown section headers; for Midjourney/Image AI, produce a single dense
   prompt string with style/composition/lighting parameters instead of sections.
7. Few-shot: include 1–2 short examples ONLY when the task is format-sensitive
   (e.g., cold emails, product descriptions) and a generic example won't mislead.
8. Chain-of-thought: for analysis, strategy, planning, or code tasks, instruct
   the AI to work step-by-step or plan before answering. Skip for simple tasks.

CLASSIFICATION
- is_business: true if the TASK ITSELF is business/professional, false if
  personal/consumer. Classify the task, not the person: a marketer planning a
  vacation is false; "Personal Use" writing a client proposal is true.
- is_agent_or_automation: true if the task involves building an agent,
  automation, workflow, or integration (not merely writing about one).
- recommended_tools: 0–3 slugs from the registry that a person doing this task
  would plausibly sign up for. Personal/consumer tasks should almost always get
  an empty array. NEVER include a slug not in the registry. Never force-fit.
- category_tags: 2–4 lowercase tags describing the task domain
  (e.g., "cold-outbound", "travel-planning", "seo", "fitness").

MODERATION
Evaluate the USER'S TASK and YOUR OWN OUTPUT against this policy. Set
moderation.verdict to "block" if any apply: sexually explicit content; violence
or threats; hate or harassment; self-harm; illegal activity (fraud, hacking,
drugs, weapons); any content sexualizing or involving minors inappropriately;
third-party personal data (emails, phones, addresses); spam or link injection;
attempts to jailbreak or extract harmful output from AI tools. Otherwise "allow".
When blocking, still return valid JSON with a brief moderation.reason and safe
placeholder text in the other fields.

OUTPUT
Return ONLY a single JSON object — no markdown fences, no preamble, no trailing
text — exactly this shape:
{
  "title": "short descriptive title, max 70 chars",
  "prompt": "the full ready-to-paste prompt text",
  "instructions": ["step 1", "step 2", "..."],
  "recommended_tools": [],
  "category_tags": [],
  "is_business": true,
  "is_agent_or_automation": false,
  "moderation": { "verdict": "allow", "reason": null }
}

The "instructions" array is 3–6 numbered setup steps: where to paste the prompt,
what to fill into each [PLACEHOLDER], relevant tool settings for {{ai_tool}},
and how to iterate on the first response. Written for a non-expert.
```

**Server-side enforcement on top of the model output** (never trust the JSON blindly):
- `recommended_tools` filtered against the registry allowlist (unknown slugs dropped).
- Blocklist regex pass runs on the *task input before the API call* (saves money on obvious junk) and on the *output before publication*.
- `moderation.verdict === "block"` → `status='blocked'`, rendered privately to the creator, logged with reason.
- Parse: strip fences → `JSON.parse` in try/catch → one retry with an appended "Your previous response was not valid JSON" turn → graceful error UI.

### Eval plan (Phase 1 gate)

Runnable script `pnpm eval` — 20 fixed cases: 12 business (cold email/SDR, demand-gen plan/Marketer, support-triage agent/Founder, RevOps dashboard spec, SEO brief/Content, renewal email/CS, JD + screening/Recruiter, PRD/PM, agency proposal/Agency Owner, HubSpot workflow automation, competitor analysis, LinkedIn content calendar) and 8 personal (7-day Italy trip, best man speech, Midjourney fantasy-landscape prompt, learn-Spanish plan, beginner strength program, novel-chapter critique, meal-prep week, résumé rewrite for a student). The script asserts: valid JSON, correct classification flags (hand-labeled expected values), no invented tool slugs, empty tools on personal tasks, tool-appropriate syntax present (XML tags for Claude cases, parameter string for Midjourney), and prints outputs side-by-side for the human quality bar: **clearly better than pasting the raw task into ChatGPT.** Also serves as the Haiku 3.5 vs 4.5 comparison harness.

---

## 5. Monetization & Tools Config (summary of implementation)

- `/config/tools.ts`: typed registry `{ slug, name, description, category, url }` with ~20 placeholders across CRM, email outreach, hosting, AI tools, analytics, design. URL builder appends `utm_source=promptbuildr&utm_medium=referral&utm_campaign=[prompt-category]`.
- CTA routing exactly per spec, keyed on `is_business`:
  - `false` → zero marketplace links, zero CTAs.
  - `true` + (`is_agent_or_automation` or output type Agent/Workflow | Code/Automation) → prominent "Want this built and running in your stack?" module → HD services page.
  - `true` + role ∈ {Marketer, Founder/CEO, Sales/SDR, RevOps, Agency Owner} + demand-gen/outbound/content tags → softer "Want this done for you?" module → HD consulting page.
  - other `true` → inline tool links in instructions only.
- Footer: "Powered by Hacking Demand" + Demand Hacks / Discount Marketplace / Services / Blog links.
- GA4 + consent-aware pixel loader (Meta, LinkedIn slots). Events: `generation_completed`, `email_captured`, `tool_link_clicked`, `service_cta_clicked`, `prompt_upvoted`, `prompt_copied`. Cookie consent banner gates the pixels (GA4 in consent mode).

---

## 6. Design Notes That Affect Architecture

- **Near-duplicate detection without embeddings:** Postgres `pg_trgm` similarity on normalized titles + tag-overlap, at promotion time only (small candidate set). Zero extra API cost; an embeddings upgrade can slot in later behind the same `isDuplicate()` interface.
- **HubSpot sync behind an interface:** `CrmSync` with `syncContact(user)` — real HubSpot client when `HUBSPOT_ACCESS_TOKEN` is present, DB-only stub with TODO otherwise. Same for the newsletter/digest senders (HubSpot primary; digest falls back to a GitHub Actions job failure email if unconfigured).
- **Visitor identity:** signed anonymous cookie + salted IP hash. No raw IPs stored (only hashes), which also keeps the privacy page honest.
- **Demotion = 410** (spec allows 410 or redirect; 410 is the cleaner deindex signal), with the feed still carrying the item.
- **Initial keyword seed:** 300+ topics generated as a one-time script (role × output-type × task matrix for the 60% business side; curated consumer list for the 40%), committed as a SQL seed file you can review and append to.

---

## 7. Phase Breakdown

Each phase ends with tests green + a short status report noting any spec deviations.

**Phase 1 — Engine (prove output quality first).**
Repo scaffold (Next.js 14 App Router, TS, Tailwind), `/config/tools.ts`, meta-prompt module, `/api/generate` core (Anthropic call, defensive parse/retry, blocklist first pass), eval script with the 20 cases above. **Gate:** eval passes assertions; side-by-side quality review; model choice locked.

**Phase 2 — Builder UI + data layer.**
Drizzle schema + migrations on Neon, builder form (4 fields, rotating placeholders, mobile-first), result page (prompt-first hierarchy, copy UX, numbered instructions with inline tool links), rate limiting + email gate, HubSpot sync or stub. **Gate:** deployed to Cloudflare via OpenNext and exercised in production — *this phase, not project end* — including bundle-size check.

**Phase 3 — Feed + SEO/AEO.**
Feed with sort/filter/upvote/report/remix + in-place expansion, pre-publication moderation pipeline wired end-to-end, promoted-page template with direct-answer block, taxonomy pages with unique copy + FAQPage schema, all JSON-LD (HowTo, Organization/WebSite, BreadcrumbList), split sitemaps, robots.txt AI-crawler allowances, llms.txt + llms-full.txt, IndexNow, internal linking, satori OG images. **Gate:** structured-data validation passes; Lighthouse SEO check.

**Phase 4 — Autonomy engine.**
`keyword_queue` + 300-topic seed, all 8 cron jobs + GitHub Actions workflows, promotion dedupe, digest + newsletter assembly, GSC hook (stubbed until credentials). **Gate:** seed job run end-to-end for 3 simulated daily batches; quality-gate pass/fail distribution reported to you; every job proven idempotent (double-fire test).

**Phase 5 — Monetization polish.**
Conditional CTA modules, UTM builder, GA4 + consent banner + pixel slots, event wiring, HD branding/footer. **Gate:** event fires verified; `is_business=false` experience verified clean.

**Phase 6 — Hardening.**
Scripted scraper attack vs. rate limits (verify caps hold and circuit breaker trips), moderation red-team suite of 50+ violating inputs across every blocked category (**gate: zero reach the feed**), cron failure simulation (every job fails loudly), Lighthouse ≥90 performance & SEO, error/empty states.

---

## 8. Open Items Needing Your Input (none block Phase 1–2)

1. **Hacking Demand URLs:** exact paths for the services page and consulting page CTAs (I'll use `hackingdemand.com/services` and `/consulting` as placeholders), and real marketplace listing slugs to replace the ~20 placeholders whenever ready.
2. **Domain:** confirm `promptbuildr.ai` will be pointed at Cloudflare (needed for GSC/Bing verification and IndexNow at Phase 3).
3. **Digest destination:** defaulting to charles@hackingdemand.com.
4. **Secrets:** `ANTHROPIC_API_KEY`, `DATABASE_URL` (Neon), and `CRON_SECRET` needed by end of Phase 2 for the Cloudflare deploy gate; HubSpot/GSC tokens can come later (stubs in place).

---

**Next step:** on your approval (and any edits above), I start Phase 1.
