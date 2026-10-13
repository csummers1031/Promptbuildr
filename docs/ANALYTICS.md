# Traffic attribution — how to read it

First-party attribution started 2026-10-13. Two tables feed it:
- **`visits`** — one row per page load from a real browser (client beacon). Classified channel: `organic | ai | social | referral | direct | internal | unknown`, plus `ai_source`, `referrer_host`, and all `utm_*`.
- **`outbound_clicks`** — every click on a money link (`data-track` anchors: affiliate/partner links + service CTAs), with `dest_host`, `placement` (`instruction | tool-chip | cta | loading-offer`), and the page it happened on.

> Google hides organic **search terms** from the referrer — those come from **Google Search Console**, not this table. `utm_term` here only captures terms we tag ourselves.

Run these in Neon → SQL Editor (branch `production`). Times are UTC.

### Where is traffic coming from? (channel mix)
```sql
SELECT channel, count(*) AS visits
FROM visits
WHERE created_at > now() - interval '7 days'
GROUP BY channel ORDER BY visits DESC;
```

### Which AI assistants are sending people?
```sql
SELECT ai_source, count(*) AS visits
FROM visits
WHERE channel = 'ai' AND created_at > now() - interval '30 days'
GROUP BY ai_source ORDER BY visits DESC;
```

### Top referrers
```sql
SELECT referrer_host, count(*) AS visits
FROM visits
WHERE referrer_host IS NOT NULL AND created_at > now() - interval '30 days'
GROUP BY referrer_host ORDER BY visits DESC LIMIT 25;
```

### Campaign / term breakdown (links we tagged with utm)
```sql
SELECT utm_source, utm_medium, utm_campaign, utm_term, count(*) AS visits
FROM visits
WHERE utm_source IS NOT NULL
GROUP BY 1,2,3,4 ORDER BY visits DESC LIMIT 50;
```

### Visits per day
```sql
SELECT date_trunc('day', created_at) AS day, count(*) AS visits
FROM visits GROUP BY 1 ORDER BY 1 DESC LIMIT 30;
```

### Which money links get clicked?
```sql
SELECT placement, dest_host, count(*) AS clicks
FROM outbound_clicks
GROUP BY 1,2 ORDER BY clicks DESC LIMIT 50;
```

### Which channel actually drives clicks? (attribution join)
Attributes each click to that visitor's most recent prior visit.
```sql
SELECT v.channel, v.ai_source, count(*) AS clicks
FROM outbound_clicks c
JOIN LATERAL (
  SELECT channel, ai_source FROM visits
  WHERE visitor_hash = c.visitor_hash AND created_at <= c.created_at
  ORDER BY created_at DESC LIMIT 1
) v ON true
WHERE c.visitor_hash IS NOT NULL
GROUP BY 1,2 ORDER BY clicks DESC;
```

## Caveats (be honest about the gaps)
- Many AI chat apps **strip the referrer**, so some AI-driven traffic lands as `direct`. We catch what's detectable (referrer host or a `utm_source` we control).
- `visitor_hash` is a hashed IP — coarse (shared IPs collide, mobile IPs rotate). Good enough for channel joins and dedupe, not precise identity.
- Bots that don't run JS never fire the beacon — intentional (keeps `visits` human-ish), but it means `visits` ≠ raw server hits.

## Fast-follows
- A gated JSON/HTML dashboard so this isn't SQL-only.
- Route-change pageview tracking (currently one visit per full page load).
- Tag our own outbound links (social posts, newsletter) with `utm_*` so they attribute cleanly.
