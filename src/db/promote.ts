import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./client";
import { prompts, reports } from "./schema";
import { SITE_URL } from "@/lib/seo";
import { slugify, normalizeForDedup } from "@/lib/feed/slug";
import { scoreQuality, qualifiesForPromotion, looksVanityOrPrivate } from "@/lib/feed/quality";

/**
 * Promotion pipeline — turns qualifying feed prompts into public, indexable
 * pages by assigning a slug + `promoted_at`. Gated by a quality floor and a
 * duplicate check so the crawlable surface only gains pages with real value.
 * All functions no-op safely without a DB.
 */

export function promptUrl(slug: string): string {
  return `${SITE_URL}/prompts/${slug}`;
}

export type PromoteReason =
  | "no-db"
  | "not-found"
  | "not-published"
  | "already"
  | "low-quality"
  | "vanity"
  | "demoted"
  | "duplicate";

export interface PromoteResult {
  promoted: boolean;
  slug?: string;
  url?: string;
  reason?: PromoteReason;
}

type Db = NonNullable<ReturnType<typeof getDb>>;

async function slugExists(db: Db, slug: string): Promise<boolean> {
  const rows = await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.slug, slug)).limit(1);
  return rows.length > 0;
}

/**
 * Ensure a prompt has a slug so it always has a shareable page at
 * /prompts/<slug>, INDEPENDENT of whether it is promoted (indexed). Returns the
 * slug (existing or newly assigned), or null without a DB. Idempotent and
 * concurrency-safe: only sets the slug when it is still null.
 */
export async function ensureSlug(id: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ slug: prompts.slug, title: prompts.title, status: prompts.status })
    .from(prompts)
    .where(eq(prompts.id, id))
    .limit(1);
  const p = rows[0];
  if (!p || p.status !== "published") return p?.slug ?? null;
  if (p.slug) return p.slug;
  const slug = await uniqueSlug(db, p.title);
  await db
    .update(prompts)
    .set({ slug, updatedAt: sql`now()` })
    .where(and(eq(prompts.id, id), isNull(prompts.slug)));
  const after = await db.select({ slug: prompts.slug }).from(prompts).where(eq(prompts.id, id)).limit(1);
  return after[0]?.slug ?? slug;
}

/** A free slug derived from the title, suffixed on collision. */
async function uniqueSlug(db: Db, title: string): Promise<string> {
  const base = slugify(title);
  if (!(await slugExists(db, base))) return base;
  for (let i = 2; i <= 50; i++) {
    const cand = `${base.slice(0, 66)}-${i}`;
    if (!(await slugExists(db, cand))) return cand;
  }
  return `${base.slice(0, 60)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Is there already a LIVE page whose normalized title matches this one? */
async function hasDuplicatePage(db: Db, title: string, excludeId: string): Promise<boolean> {
  const norm = normalizeForDedup(title);
  if (!norm) return false;
  const rows = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(
      and(
        isNotNull(prompts.promotedAt),
        isNull(prompts.demotedAt),
        eq(prompts.status, "published"),
        sql`regexp_replace(lower(${prompts.title}), '[^a-z0-9]+', '', 'g') = ${norm}`,
        sql`${prompts.id} <> ${excludeId}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Promote one prompt to a public page if it clears the gates. Idempotent. */
export async function promotePromptById(id: string): Promise<PromoteResult> {
  const db = getDb();
  if (!db) return { promoted: false, reason: "no-db" };

  const rows = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  const p = rows[0];
  if (!p) return { promoted: false, reason: "not-found" };
  if (p.status !== "published") return { promoted: false, reason: "not-published" };
  // A demoted prompt stays deindexed. Re-promotion must be an explicit admin
  // action, never an automatic retry (which would silently undo moderation).
  if (p.demotedAt) return { promoted: false, reason: "demoted" };
  if (p.promotedAt && p.slug) {
    return { promoted: true, slug: p.slug, url: promptUrl(p.slug), reason: "already" };
  }

  const instructionsCount = Array.isArray(p.instructions) ? (p.instructions as unknown[]).length : 0;
  const signals = { title: p.title, promptText: p.promptText, instructionsCount, taskInput: p.taskInput };
  // Branded/private one-offs get a shareable page but are never indexed.
  if (looksVanityOrPrivate(p.title, p.taskInput)) return { promoted: false, reason: "vanity" };
  if (!qualifiesForPromotion(signals)) return { promoted: false, reason: "low-quality" };
  if (await hasDuplicatePage(db, p.title, p.id)) return { promoted: false, reason: "duplicate" };

  const slug = p.slug ?? (await uniqueSlug(db, p.title));
  // Guard on promoted_at IS NULL so a concurrent cron + inline promote can't
  // both flip it (and double-ping IndexNow).
  await db
    .update(prompts)
    .set({
      slug,
      promotedAt: sql`now()`,
      qualityScore: scoreQuality(signals),
      updatedAt: sql`now()`,
    })
    .where(and(eq(prompts.id, id), isNull(prompts.promotedAt)));
  return { promoted: true, slug, url: promptUrl(slug) };
}

/** Sweep published, un-promoted prompts and promote the ones that qualify. */
export async function promoteEligiblePrompts(
  limit = 200,
): Promise<{ promotedUrls: string[]; checked: number; skipped: number }> {
  const db = getDb();
  if (!db) return { promotedUrls: [], checked: 0, skipped: 0 };

  const candidates = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(and(eq(prompts.status, "published"), isNull(prompts.promotedAt), isNull(prompts.demotedAt)))
    .limit(limit);

  const promotedUrls: string[] = [];
  let skipped = 0;
  for (const c of candidates) {
    const r = await promotePromptById(c.id);
    if (r.promoted && r.url && r.reason !== "already") promotedUrls.push(r.url);
    else if (!r.promoted) skipped++;
  }
  return { promotedUrls, checked: candidates.length, skipped };
}

/** Demote (deindex) live pages that have crossed the user-report threshold. */
export async function demoteEligiblePrompts(
  reportThreshold = 3,
): Promise<{ demotedUrls: string[]; checked: number }> {
  const db = getDb();
  if (!db) return { demotedUrls: [], checked: 0 };

  const rows = await db
    .select({ id: prompts.id, slug: prompts.slug })
    .from(prompts)
    .leftJoin(reports, eq(reports.promptId, prompts.id))
    .where(and(isNotNull(prompts.promotedAt), isNull(prompts.demotedAt)))
    .groupBy(prompts.id, prompts.slug)
    .having(sql`count(distinct ${reports.visitorHash}) >= ${reportThreshold}`);

  const demotedUrls: string[] = [];
  for (const r of rows) {
    await db
      .update(prompts)
      .set({ demotedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(prompts.id, r.id));
    if (r.slug) demotedUrls.push(promptUrl(r.slug));
  }
  return { demotedUrls, checked: rows.length };
}
