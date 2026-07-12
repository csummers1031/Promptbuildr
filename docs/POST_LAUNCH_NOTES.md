# Post-launch backlog

## Consumer display-ads test (revisit at traffic)
Decision (pre-launch): do NOT add display ads now. Rationale: AI cost per use (~$0.008)
makes ad margins thin; display ads need large volume + network approval; business-user
ad impressions would cannibalize far-higher-value affiliate/lead-gen; ads hurt Core Web
Vitals (the SEO engine) and the clean UX.

Revisit once real traffic exists (~few thousand visits/mo):
- Test display ads on PERSONAL/CONSUMER pages ONLY (is_business=false) — currently
  unmonetized traffic. Never on business pages.
- Measure against: page-speed / Lighthouse hit, email-capture conversion, retargeting.
- Keep only if net-positive after the UX/speed cost.

## Other fast-follows (from phase reports)
- Cookie consent banner + GA4 + pixel loader (Phase 5)
- Autonomy engine cron jobs (Phase 4): daily seed, promotion/quality gate, demotion,
  leaderboard, link-rot, weekly digest, newsletter, GSC loop
- Replace ~20 placeholder tool URLs with real marketplace listings (import script)
- Hardening pass (Phase 6): abuse test, 50+ moderation red-team, Lighthouse 90+
