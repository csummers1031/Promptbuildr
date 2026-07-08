import { sql, and, eq, gte } from "drizzle-orm";
import { getDb } from "./client";
import {
  users,
  prompts,
  generations,
  toolOpportunities,
  moderationLog,
} from "./schema";
import type { ToolRef } from "@/lib/tools/resolve";
import type { PresentedGeneration } from "@/lib/present";

/**
 * All functions no-op (returning sensible defaults) when the DB isn't
 * configured, so the app runs without DATABASE_URL.
 */

export interface PersistGenerationArgs {
  userId: string | null;
  ipHash: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** null when the prompt was blocked / errored and not stored */
  promptId: string | null;
}

export async function recordGeneration(args: PersistGenerationArgs): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(generations).values({
    userId: args.userId ?? undefined,
    ipHash: args.ipHash,
    promptId: args.promptId ?? undefined,
    inputTokens: args.inputTokens,
    outputTokens: args.outputTokens,
    costMicros: Math.round(args.costUsd * 1_000_000),
  });
}

/** Count generations for an IP hash since a cutoff (rate limiting). */
export async function countGenerationsByIp(ipHash: string, since: Date): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(generations)
    .where(and(eq(generations.ipHash, ipHash), gte(generations.createdAt, since)));
  return rows[0]?.n ?? 0;
}

export async function countGenerationsByUser(userId: string, since: Date): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(generations)
    .where(and(eq(generations.userId, userId), gte(generations.createdAt, since)));
  return rows[0]?.n ?? 0;
}

export interface StorePromptArgs {
  presented: PresentedGeneration;
  taskInput: string;
  role: string;
  aiTool: string;
  outputType: string;
  isAgentOrAutomation: boolean;
  recommendedTools: ToolRef[];
  source: "user" | "seed";
  userId: string | null;
  status: "published" | "private" | "blocked" | "pending_review";
  moderation: unknown;
}

/** Store a generated prompt; returns its id, or null when DB absent. */
export async function storePrompt(args: StorePromptArgs): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .insert(prompts)
    .values({
      title: args.presented.title,
      promptText: args.presented.prompt,
      instructions: args.presented.instructions.map((segs) => segs.map((s) => s.value).join("")),
      recommendedTools: args.recommendedTools,
      categoryTags: args.presented.categoryTags,
      role: args.role,
      aiTool: args.aiTool,
      outputType: args.outputType,
      taskInput: args.taskInput,
      isBusiness: args.presented.isBusiness,
      isAgentOrAutomation: args.isAgentOrAutomation,
      source: args.source,
      userId: args.userId ?? undefined,
      status: args.status,
      moderation: args.moderation as object,
    })
    .returning({ id: prompts.id });
  return rows[0]?.id ?? null;
}

/** Log every off-registry recommendation to the affiliate-opportunity feed. */
export async function recordToolOpportunities(
  offRegistry: ToolRef[],
  promptId: string | null,
): Promise<void> {
  const db = getDb();
  if (!db || offRegistry.length === 0) return;
  for (const ref of offRegistry) {
    await db
      .insert(toolOpportunities)
      .values({
        normalizedName: ref.normalized,
        displayName: ref.name,
        category: null,
        count: 1,
        samplePromptIds: promptId ? [promptId] : [],
      })
      .onConflictDoUpdate({
        target: toolOpportunities.normalizedName,
        set: {
          count: sql`${toolOpportunities.count} + 1`,
          lastSeen: sql`now()`,
          displayName: ref.name,
          samplePromptIds: promptId
            ? sql`(array(select distinct unnest(${toolOpportunities.samplePromptIds} || ${sql`ARRAY[${promptId}]::text[]`})))[1:5]`
            : toolOpportunities.samplePromptIds,
        },
      });
  }
}

export async function recordModerationBlock(
  promptId: string | null,
  stage: "blocklist" | "model",
  reason: string,
  matchedPattern?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(moderationLog).values({
    promptId: promptId ?? undefined,
    stage,
    reason,
    matchedPattern: matchedPattern ?? undefined,
  });
}

// --- Users ---

export async function upsertUser(email: string, role: string): Promise<{ id: string } | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .insert(users)
    .values({ email, role })
    .onConflictDoUpdate({ target: users.email, set: { role } })
    .returning({ id: users.id });
  return rows[0] ?? null;
}
