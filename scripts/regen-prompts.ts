/**
 * Regenerate existing prompts IN PLACE with the current generation pipeline.
 *
 * Why: prompts created before a meta-prompt change carry the old style (raw
 * placeholders instead of "ask me for X", stale capability claims, drifted
 * titles, no tool links on tool-relevant tasks). This re-runs generation from
 * each prompt's stored inputs and updates its content, KEEPING the id, slug,
 * promotion status, and engagement counts so URLs and indexing are preserved.
 *
 * Usage (needs DATABASE_URL + ANTHROPIC_API_KEY):
 *   pnpm tsx scripts/regen-prompts.ts [id1 id2 ...]
 * With no ids, regenerates the default set below.
 */
import { loadEnvLocal } from "./eval/loadEnv";
loadEnvLocal();
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { prompts } from "@/db/schema";
import { generatePrompt } from "@/lib/generate";
import { presentGeneration } from "@/lib/present";
import { pingIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";

// Live, model-generated prompts created before today's meta-prompt deploy.
// (The crowdfunded-website prompt was generated after the deploy and is already
// new-style; the hackingdemand blog prompt is a demoted vanity page.)
const DEFAULT_IDS = [
  "23968782-e6df-48e1-a1cf-83142cb01a73", // make-ai-tools-remember-context
  "26948c83-46b6-4af6-9889-47c245856fe6", // 14-day pre-wedding workout + meal plan
  "739aa03c-2e8c-403f-be97-64841768c024", // one-way Dallas->El Paso flight search
];

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL is not set — cannot regenerate.");
    process.exit(1);
  }
  const ids = process.argv.slice(2).filter(Boolean);
  const targets = ids.length ? ids : DEFAULT_IDS;
  const toIndex: string[] = [];
  let ok = 0;

  for (const id of targets) {
    const rows = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      console.log(`skip ${id}: not found`);
      continue;
    }
    const input = {
      task: row.taskInput,
      role: row.role,
      aiTool: row.aiTool,
      outputType: row.outputType,
    };
    const r = await generatePrompt(input);
    if (r.status !== "ok") {
      console.log(`skip ${id}: generation ${r.status}`);
      continue;
    }
    const p = presentGeneration(r.output, {
      role: row.role,
      outputType: row.outputType,
      aiTool: row.aiTool,
    });

    await db
      .update(prompts)
      .set({
        title: p.title,
        promptText: p.prompt,
        instructions: p.instructions.map((segs) => segs.map((s) => s.value).join("")),
        recommendedTools: r.output.recommended_tools,
        categoryTags: p.categoryTags,
        isBusiness: p.isBusiness,
        isAgentOrAutomation: r.output.is_agent_or_automation,
        moderation: r.output.moderation,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, id));

    ok++;
    console.log(`regenerated ${id}: "${p.title}" (business=${p.isBusiness}, tools=${r.output.recommended_tools.length})`);
    // Only ping IndexNow for pages that are actually live (promoted, not demoted).
    if (row.slug && row.promotedAt && !row.demotedAt) {
      toIndex.push(`${SITE_URL}/prompts/${row.slug}`);
    }
  }

  if (toIndex.length) {
    try {
      await pingIndexNow(toIndex);
      console.log(`IndexNow pinged ${toIndex.length} URL(s).`);
    } catch (e) {
      console.log("IndexNow ping failed (non-fatal):", (e as Error).message);
    }
  }
  console.log(`\nDone: ${ok}/${targets.length} regenerated.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
