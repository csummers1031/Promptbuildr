import { NextRequest, NextResponse } from "next/server";
import { sql, eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { reports, prompts } from "@/db/schema";
import { COOKIE_ANON, extractIp, visitorHash, verifyValue, type AnonData } from "@/lib/identity";

export const runtime = "nodejs";

/** Reports from this many distinct visitors auto-unpublish pending review. */
const REPORT_THRESHOLD = 3;
const MAX_REASON = 200;

/** POST /api/report { promptId, reason? } */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const b = body as { promptId?: unknown; reason?: unknown };
  if (typeof b.promptId !== "string" || !b.promptId) {
    return NextResponse.json({ error: "promptId required" }, { status: 400 });
  }
  const reason = typeof b.reason === "string" ? b.reason.slice(0, MAX_REASON) : "user-report";
  const promptId = b.promptId;

  const db = getDb();
  if (!db) {
    return NextResponse.json({ status: "ok", persisted: false });
  }

  const anon = await verifyValue<AnonData>(req.cookies.get(COOKIE_ANON)?.value);
  const ip = extractIp(req.headers);
  const vhash = await visitorHash(anon?.id ?? "anon", ip);

  try {
    await db.insert(reports).values({ promptId, reason, visitorHash: vhash });

    // Count distinct reporters; auto-unpublish at threshold.
    const distinct = await db
      .select({ n: sql<number>`count(distinct ${reports.visitorHash})::int` })
      .from(reports)
      .where(eq(reports.promptId, promptId));
    const count = distinct[0]?.n ?? 0;
    if (count >= REPORT_THRESHOLD) {
      await db
        .update(prompts)
        .set({ status: "pending_review" })
        .where(and(eq(prompts.id, promptId), eq(prompts.status, "published")));
    }
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "report failed" }, { status: 500 });
  }
}
