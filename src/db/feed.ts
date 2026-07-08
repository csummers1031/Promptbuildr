import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./client";
import { prompts } from "./schema";
import type { ToolRef } from "@/lib/tools/resolve";
import {
  type FeedPrompt,
  type FeedQuery,
  compareForSort,
  windowStart,
} from "@/lib/feed/types";
import { sampleFeed } from "@/lib/feed/samples";

type PromptRow = typeof prompts.$inferSelect;

function rowToFeed(r: PromptRow): FeedPrompt {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    promptText: r.promptText,
    instructions: (r.instructions as string[]) ?? [],
    recommendedTools: (r.recommendedTools as ToolRef[]) ?? [],
    categoryTags: r.categoryTags ?? [],
    role: r.role,
    aiTool: r.aiTool,
    outputType: r.outputType,
    isBusiness: r.isBusiness,
    isAgentOrAutomation: r.isAgentOrAutomation,
    source: r.source,
    upvoteCount: r.upvoteCount,
    viewCount: r.viewCount,
    promotedAt: r.promotedAt ? r.promotedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Apply role/tool/output filters + time window + sort over a JS array. */
function filterAndSort(items: FeedPrompt[], q: FeedQuery, now: Date): FeedPrompt[] {
  const start = windowStart(q.sort, now);
  let out = items.filter((p) => {
    if (q.role && p.role !== q.role) return false;
    if (q.aiTool && p.aiTool !== q.aiTool) return false;
    if (q.outputType && p.outputType !== q.outputType) return false;
    if (start && new Date(p.createdAt) < start) return false;
    return true;
  });
  out = out.sort((a, b) => compareForSort(a, b, q.sort));
  return out.slice(q.offset, q.offset + q.limit);
}

export async function getFeed(q: FeedQuery, now: Date): Promise<FeedPrompt[]> {
  const db = getDb();
  if (!db) {
    return filterAndSort(sampleFeed(now), q, now);
  }

  const conds = [eq(prompts.status, "published")];
  if (q.role) conds.push(eq(prompts.role, q.role));
  if (q.aiTool) conds.push(eq(prompts.aiTool, q.aiTool));
  if (q.outputType) conds.push(eq(prompts.outputType, q.outputType));
  const start = windowStart(q.sort, now);
  if (start) conds.push(gte(prompts.createdAt, start));

  const order =
    q.sort === "newest"
      ? [desc(prompts.createdAt)]
      : [desc(prompts.upvoteCount), desc(prompts.viewCount), desc(prompts.createdAt)];

  const rows = await db
    .select()
    .from(prompts)
    .where(and(...conds))
    .orderBy(...order)
    .limit(q.limit)
    .offset(q.offset);

  return rows.map(rowToFeed);
}

/** A single promoted prompt by slug (published + promoted, not demoted). */
export async function getPromptBySlug(slug: string, now: Date): Promise<FeedPrompt | null> {
  const db = getDb();
  if (!db) {
    const found = sampleFeed(now).find((p) => p.slug === slug && p.promotedAt);
    return found ?? null;
  }
  const rows = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.slug, slug),
        eq(prompts.status, "published"),
        isNotNull(prompts.promotedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || row.demotedAt) return null;
  return rowToFeed(row);
}

/** 3–5 related promoted prompts sharing tags (for internal linking). */
export async function getRelatedPrompts(
  base: FeedPrompt,
  now: Date,
  limit = 4,
): Promise<FeedPrompt[]> {
  const db = getDb();
  if (!db) {
    return sampleFeed(now)
      .filter(
        (p) =>
          p.id !== base.id &&
          p.promotedAt &&
          p.categoryTags.some((t) => base.categoryTags.includes(t)),
      )
      .slice(0, limit);
  }
  if (base.categoryTags.length === 0) return [];
  const rows = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.status, "published"),
        isNotNull(prompts.promotedAt),
        sql`${prompts.categoryTags} && ${sql`ARRAY[${sql.join(
          base.categoryTags.map((t) => sql`${t}`),
          sql`, `,
        )}]::text[]`}`,
        sql`${prompts.id} <> ${base.id}`,
      ),
    )
    .limit(limit);
  return rows.map(rowToFeed);
}

/** All promoted slugs (for the sitemap). */
export async function getPromotedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const db = getDb();
  if (!db) {
    return sampleFeed(new Date(0))
      .filter((p) => p.slug && p.promotedAt)
      .map((p) => ({ slug: p.slug!, updatedAt: p.promotedAt! }));
  }
  const rows = await db
    .select({ slug: prompts.slug, updatedAt: prompts.updatedAt })
    .from(prompts)
    .where(and(eq(prompts.status, "published"), isNotNull(prompts.promotedAt)));
  return rows
    .filter((r): r is { slug: string; updatedAt: Date } => Boolean(r.slug))
    .map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
}
