/**
 * Live eval runner: `pnpm eval` (requires ANTHROPIC_API_KEY).
 *
 * Runs all 20 fixture cases through the real generation pipeline, applies the
 * assertions, prints a per-case table plus token/cost totals, and writes full
 * outputs to eval-results.json for the human quality review (the bar: clearly
 * better than pasting the raw task into ChatGPT).
 *
 * Options:
 *   --only <id-prefix>   run a subset (e.g. --only p0 for personal cases)
 *   --concurrency <n>    parallel requests (default 4)
 */
import fs from "node:fs";
import { loadEnvLocal } from "./loadEnv";

loadEnvLocal();

import { generatePrompt, type GenerationResult } from "@/lib/generate";
import { EVAL_CASES, type EvalCase } from "./cases";
import { evaluateCase, type CaseEvaluation } from "./assert";

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set — the eval needs live API access.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
  const concIdx = args.indexOf("--concurrency");
  const concurrency = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) || 4 : 4;

  const cases = only ? EVAL_CASES.filter((c) => c.id.startsWith(only)) : EVAL_CASES;
  console.log(`Running ${cases.length} eval case(s) on model ${process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"}...\n`);

  const runs = await runWithConcurrency(cases, concurrency, async (c: EvalCase) => {
    const started = Date.now();
    const result = await generatePrompt(c.input);
    return { c, result, ms: Date.now() - started };
  });

  const evaluations: CaseEvaluation[] = [];
  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const { c, result, ms } of runs) {
    const evaluation = evaluateCase(c, result);
    evaluations.push(evaluation);
    if (result.status === "ok") {
      totalCost += result.usage.estimatedCostUsd;
      totalIn += result.usage.inputTokens;
      totalOut += result.usage.outputTokens;
    }
    const mark = evaluation.failures.length ? "✗" : evaluation.warnings.length ? "△" : "✓";
    console.log(`${mark} ${c.id}  ${c.label}  (${ms}ms)`);
    for (const f of evaluation.failures) console.log(`    FAIL: ${f}`);
    for (const w of evaluation.warnings) console.log(`    warn: ${w}`);
  }

  const failed = evaluations.filter((e) => e.failures.length);
  console.log(`\n${cases.length - failed.length}/${cases.length} passed, ${failed.length} failed`);
  console.log(`Tokens: ${totalIn} in / ${totalOut} out — est. cost $${totalCost.toFixed(4)} (avg $${(totalCost / cases.length).toFixed(4)}/generation)`);

  const detail = runs.map(({ c, result, ms }) => ({
    id: c.id,
    label: c.label,
    input: c.input,
    ms,
    result: sanitizeForReport(result),
    evaluation: evaluations.find((e) => e.id === c.id),
  }));
  fs.writeFileSync("eval-results.json", JSON.stringify(detail, null, 2));
  console.log("Full outputs written to eval-results.json for quality review.");

  process.exit(failed.length ? 1 : 0);
}

function sanitizeForReport(result: GenerationResult) {
  return result; // full detail is wanted in the local report file
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
