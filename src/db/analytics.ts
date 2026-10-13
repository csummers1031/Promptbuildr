import { sql, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { visits, outboundClicks, prompts, promptDailyStats } from "@/db/schema";
import type { Channel } from "@/lib/attribution";

/** Increment a prompt's view count (+ per-day stat). No-op without a DB. */
export async function recordPromptView(promptId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db
      .update(prompts)
      .set({ viewCount: sql`${prompts.viewCount} + 1` })
      .where(eq(prompts.id, promptId));
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    await db
      .insert(promptDailyStats)
      .values({ promptId, date: day, views: 1, upvotes: 0 })
      .onConflictDoUpdate({
        target: [promptDailyStats.promptId, promptDailyStats.date],
        set: { views: sql`${promptDailyStats.views} + 1` },
      });
  } catch (e) {
    console.error("recordPromptView failed:", e);
  }
}

const cap = (s: string | null | undefined, n: number): string | null =>
  s == null ? null : s.slice(0, n);

export interface VisitRecord {
  path: string;
  referrer: string | null;
  referrerHost: string | null;
  channel: Channel;
  aiSource: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  country: string | null;
  visitorHash: string | null;
}

export async function recordVisit(v: VisitRecord): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(visits).values({
      path: cap(v.path, 512) ?? "/",
      referrer: cap(v.referrer, 1024),
      referrerHost: cap(v.referrerHost, 255),
      channel: v.channel,
      aiSource: cap(v.aiSource, 64),
      utmSource: cap(v.utmSource, 255),
      utmMedium: cap(v.utmMedium, 255),
      utmCampaign: cap(v.utmCampaign, 255),
      utmTerm: cap(v.utmTerm, 255),
      utmContent: cap(v.utmContent, 255),
      country: cap(v.country, 8),
      visitorHash: cap(v.visitorHash, 128),
    });
  } catch (e) {
    console.error("recordVisit failed:", e);
  }
}

export interface ClickRecord {
  href: string;
  destHost: string | null;
  label: string | null;
  placement: string | null;
  path: string | null;
  visitorHash: string | null;
}

export async function recordOutboundClick(c: ClickRecord): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(outboundClicks).values({
      href: cap(c.href, 2048) ?? "",
      destHost: cap(c.destHost, 255),
      label: cap(c.label, 160),
      placement: cap(c.placement, 64),
      path: cap(c.path, 512),
      visitorHash: cap(c.visitorHash, 128),
    });
  } catch (e) {
    console.error("recordOutboundClick failed:", e);
  }
}
