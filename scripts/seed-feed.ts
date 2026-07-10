/**
 * One-time: load scripts/seed-data.json into the prompts table so the feed is
 * populated at launch. Idempotent by slug/title. Run once against the live DB:
 *   DATABASE_URL=... pnpm tsx scripts/seed-feed.ts
 */
import fs from "node:fs";
import { loadEnvLocal } from "./eval/loadEnv";
loadEnvLocal();
import { getDb } from "@/db/client";
import { prompts } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Seed {
  slug: string | null;
  title: string;
  promptText: string;
  instructions: string[];
  recommendedTools: unknown[];
  categoryTags: string[];
  role: string;
  aiTool: string;
  outputType: string;
  taskInput: string;
  isBusiness: boolean;
  isAgentOrAutomation: boolean;
  promote: boolean;
  moderation: unknown;
}

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL is not set — cannot seed. Set it and re-run.");
    process.exit(1);
  }
  const seeds: Seed[] = JSON.parse(fs.readFileSync("scripts/seed-data.json", "utf8"));
  const now = new Date();
  let inserted = 0;
  let skipped = 0;

  for (const s of seeds) {
    // Skip if a prompt with this exact title already exists (idempotent).
    const existing = await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.title, s.title)).limit(1);
    if (existing.length) {
      skipped++;
      continue;
    }
    await db.insert(prompts).values({
      slug: s.promote ? s.slug : null,
      title: s.title,
      promptText: s.promptText,
      instructions: s.instructions,
      recommendedTools: s.recommendedTools,
      categoryTags: s.categoryTags,
      role: s.role,
      aiTool: s.aiTool,
      outputType: s.outputType,
      taskInput: s.taskInput,
      isBusiness: s.isBusiness,
      isAgentOrAutomation: s.isAgentOrAutomation,
      source: "seed",
      status: "published",
      moderation: s.moderation as object,
      promotedAt: s.promote ? now : null,
      // Seed with modest starting engagement so the feed looks alive.
      upvoteCount: Math.floor(15 + Math.random() * 60),
      viewCount: Math.floor(120 + Math.random() * 500),
    });
    inserted++;
  }
  console.log(`Seed complete: ${inserted} inserted, ${skipped} already present.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
