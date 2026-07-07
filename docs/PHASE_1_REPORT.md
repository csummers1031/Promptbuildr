# Phase 1 — Engine: Status Report

**Goal:** prove prompt-output quality before building UI. Meta-prompt, generation API, tools config, JSON parsing/retry, and a 20-case eval harness.

## What shipped

| Area | Files |
|---|---|
| Project scaffold | `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, Tailwind v4, `src/app/*`, `.env.example` |
| Constants (model, roles, dropdowns, caps) | `src/config/constants.ts` |
| Tools registry (21 placeholder entries) | `src/config/tools.data.json`, `src/config/tools.ts` |
| CSV/JSON import script | `scripts/import-tools.ts` (`pnpm import-tools`) |
| Meta-prompt | `src/lib/prompt/metaPrompt.ts` |
| Output schema + structural validation | `src/lib/prompt/schema.ts` |
| Defensive JSON parse (fences → parse → extract → retry) | `src/lib/prompt/parse.ts` |
| Moderation blocklist (first pass) | `src/lib/moderation/blocklist.ts` |
| Tool validation + render-time resolution | `src/lib/tools/resolve.ts` |
| Generation pipeline | `src/lib/generate.ts` |
| API route | `src/app/api/generate/route.ts` |
| Eval: 20 cases, pure assertions, live runner | `scripts/eval/{cases,assert,run}.ts` (`pnpm eval`) |
| Unit tests (63) | `tests/*.test.ts` |

## Verification

- **`pnpm test` → 63/63 passing** (parse, schema, blocklist, tool resolution, eval assertions). No API key needed — assertion logic is pure and unit-tested independently of the model.
- **`pnpm typecheck` → clean.**
- **`pnpm exec next build` → green**, `/api/generate` compiles as a dynamic server route.
- **`pnpm import-tools` smoke-tested**: valid CSV merges; a CSV with a bad category, an `http` URL, and a missing name is rejected with per-row errors and writes nothing.

## Deviations from the original spec (and why)

1. **Model changed to `claude-haiku-4-5`.** Per your note 1, I verified against platform.claude.com: **`claude-3-5-haiku` was retired 2026-02-19** and Haiku 3 is deprecated. Haiku 4.5 is the only current Haiku. Verified pricing **$1.00 / $5.00 per MTok** (the old plan assumed Haiku 3.5's $0.80/$4.00).
   - **Cost delta:** ~+26% per generation → **$0.0063/generation**; launch-scale total revised **~$10 → ~$13/mo**, still far under the $50 `MONTHLY_SPEND_CAP`. `BUILD_PLAN.md §1.3` updated with the recalculated table.
   - Model stays configurable via `ANTHROPIC_MODEL`.

2. **Structured outputs used as the primary path.** Haiku 4.5 supports `output_config.format` with a JSON schema, which the original plan (written for Haiku 3.5) didn't assume. The generation call now enforces the schema server-side, so schema-valid JSON is guaranteed on the happy path. The spec's defensive parse + single retry is kept as the fallback layer (belt and suspenders).

3. **Off-registry tool recommendations (your note 4) fully implemented in Phase 1** rather than deferred:
   - Meta-prompt permits off-registry tools by name + official homepage, registry-preferred.
   - `resolve.ts` validates: registry-first (by slug or normalized name), off-registry capped at 2 and total at 3, names sanitized + blocklist-checked, homepage URLs domain-validated (https, root/one-segment, no shorteners/IPs/query strings — no fabricated or affiliate-smuggled URLs).
   - **References are stored by normalized name; destination URLs resolve at render time** — so when you later add a tool to the registry, every existing reference auto-upgrades to your marketplace link with UTMs, no backfill. This is unit-tested (`resolve.test.ts` → "auto-upgrades at render time").
   - `offRegistryRefs()` exposes the feed for the `tool_opportunities` table + digest section (persistence lands in Phase 2/4 with the DB).

4. **Import script accepts CSV *and* JSON** (your note 3), validates URLs on import, rejects malformed rows with clear row-numbered errors, and supports `--merge`. Placeholder entries are clearly Hacking-Demand-marketplace-shaped and ready to be replaced by your exported list. Nothing in Phases 1–3 hard-blocks on real URLs.

5. **Monthly spend groundwork (your note 5):** every generation returns server-side `usage` with token counts and a verified-pricing USD estimate (`generate.ts`), and `MONTHLY_SPEND_CAP` (default 50) is in `.env.example` — ready for the Phase 2 DB tracker + circuit breaker. Usage is never sent to the client.

## The one thing not yet verified: live eval quality

The eval **harness** is complete and its assertion logic is unit-tested, but the **live run against the model requires `ANTHROPIC_API_KEY`**, which isn't available in this build environment. `pnpm eval` will, the moment a key is present:
- run all 20 cases (12 business / 8 personal) through the real pipeline,
- assert classification flags, empty-tools-on-personal, no invented slugs, tool-appropriate syntax (XML for Claude, dense descriptor for Midjourney), and structural quality,
- print token/cost totals and write full outputs to `eval-results.json` for your side-by-side "clearly better than raw ChatGPT" review.

**This is the Phase 1 quality gate and it is not yet passed** — it needs a key. Options: (a) add `ANTHROPIC_API_KEY` to this environment and I run it now, or (b) you run `pnpm eval` locally. I recommend (a) so I can lock the model choice (and, if quality is short, run the same harness against Haiku 4.5 at higher effort or a larger model before Phase 2).

## Ready for your go/no-go on Phase 2

Phase 2 = Builder UI + Drizzle/Neon schema + rate limiting + email gate + HubSpot stub + the spend circuit breaker + the Cloudflare/OpenNext deploy gate.
