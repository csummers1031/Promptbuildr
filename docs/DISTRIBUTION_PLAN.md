# Promptbuildr — Distribution Plan (first 90 days)

> Written 2026-10-14. The foundation is built (feed compounds, 21 indexable pages
> growing, schema + attribution live). The product works. The gap is **traffic**.
> This is the plan to get the flywheel spinning.

## The core truth
SEO/UGC **compounds but is slow** (4–12 weeks to rank). So we run **two tracks in parallel**:
- **Track A — Seed the content** so there's a surface worth finding/ranking.
- **Track B — Drive the first real humans** (owned + earned) to validate, earn shares,
  generate the first affiliate clicks, and send early ranking signals.

Revenue note: Claude referral is capped (~$30/mo, already maxed). **Real revenue = the
uncapped affiliate partners (Instantly/Apollo/n8n/etc.), which need VOLUME.** Everything
below is about volume of the right visitors.

---

## Phase 0 — Plumbing (this week, ~1–2 hrs, mostly quick)
1. **Bing Webmaster Tools** — add the site + submit sitemap. *Critical:* ChatGPT's
   citations map heavily to Bing's index, so Bing indexing ≈ AI-answer visibility.
2. **Google Search Console** — confirm the sitemap flipped to "Success"; use "Request
   indexing" on the homepage, feed, and top prompt pages.
3. **Cron backstop** — enable the promote/demote sweeps (needs `cron.yml` on `main`, or a
   Cloudflare Cron Trigger). Not blocking (inline promotion works), but turn it on so the
   surface stays fresh and demotion works.
4. **Attribution** — already live; we watch visits-by-channel + outbound clicks weekly.

## Phase 1 — Seed the content (weeks 1–3) — the biggest SEO lever
The flywheel needs pages to rank. Generate **50–150 high-quality prompts** targeting real
search demand, across BOTH audiences:
- **Business:** cold outreach email, SEO content brief, job description, PRD, sales
  sequence, LinkedIn post, cold-call script, meeting agenda, SOP, OKRs…
- **Personal:** trip itinerary, meal prep, workout plan, resume, cover letter, wedding
  speech, study plan, budget, gift ideas, parenting schedule…
Target **long-tail, low-competition** queries first ("ChatGPT prompt for a 5-day Italy
itinerary" beats "ChatGPT prompts"). Each becomes an indexable, schema-marked page.
→ **Claude can batch-generate + curate these through the existing quality-gated pipeline.**

## Phase 2 — Owned channels (weeks 1–4) — fastest real traffic, free
**Hacking Demand is your unfair advantage.** It has domain authority, an audience, a blog,
an email list, and HubSpot. Use it:
1. **HD blog post(s)** featuring Promptbuildr + 5–10 specific prompts. An HD→Promptbuildr
   link passes SEO authority *and* sends referral traffic. (Claude can draft these.)
2. **Link from HD** — nav, footer, and/or a resources page.
3. **Email the HD list** announcing Promptbuildr (free tool for their audience).
4. **Internal links** — mention/link Promptbuildr from relevant existing HD articles.

## Phase 3 — Earned / community (weeks 2–8) — spikes + signals + backlinks
Post genuinely useful, specific prompts (value-first, not spam), each linking to its
prompt page:
- **Reddit** (highest intent): r/ChatGPT, r/PromptEngineering, r/ArtificialIntelligence,
  plus niche subs that match the prompt (r/Entrepreneur, r/smallbusiness, r/travel,
  r/fitness, r/resumes, r/Cooking…).
- **X/Twitter:** prompt threads / build-in-public.
- **LinkedIn:** business prompts for the professional crowd (HD's audience overlaps).
- **Product Hunt launch:** coordinated — drives a spike, credibility, and a backlink.
- **AI tool directories:** Futurepedia, There's An AI For That, AI Tools Directory, etc.
  — free listings = backlinks + steady referral trickle. List on the top ~10.
- **Hacker News "Show HN":** hit-or-miss, but a hit is a big spike.
*(Claude can draft the launch copy / posts; you publish from your accounts.)*

## Phase 4 — Compounding SEO/AEO (ongoing)
- Keep the UGC flywheel fed (every generation = a new page; seeding accelerates it).
- Watch GSC for which queries you rank for → **generate more prompts in winning
  categories** (double down on what's working).
- Build a few **pillar guide pages** ("Best ChatGPT prompts for sales", etc.) that
  internally link to many prompt pages — ranks for head terms + spreads link equity.
- Backlinks compound: directories, HD, any press/mentions.

---

## Do these FIRST (the 20% that drives 80%)
1. **Bing Webmaster + GSC indexing** (1 hr) — unlocks Google *and* AI-answer visibility.
2. **HD cross-promotion** (blog + link + email) — real traffic from an audience that
   already trusts you, this week.
3. **Seed 50–100 quality prompts** — gives SEO + AI something to find. *(Claude helps.)*
4. **Reddit + X** value posts of specific prompts.
5. **Directory listings + a Product Hunt launch.**

## Who does what
- **Claude can:** batch-generate & curate seed prompts; draft the HD blog post(s); draft
  Reddit/X/LinkedIn/PH/Show-HN copy; build pillar pages; pull weekly traffic reports from
  Neon; wire IndexNow pings; any code.
- **You do:** publish on external platforms (your accounts), send the HD email, approve
  content, the Product Hunt launch.

## Realistic expectations
- **This week:** HD + community can bring the first real visitors.
- **Weeks 4–12:** SEO starts showing as pages get indexed and rank; the flywheel begins
  to compound.
- **Affiliate revenue follows volume** — first clicks from the initial traffic, growing
  as the indexed surface and traffic grow.

## Measurement (weekly, from the attribution we built)
Visits by channel (Organic / AI / Social / Referral / Direct), top prompts by views,
outbound affiliate clicks by partner, signups. Claude can pull this on request.
