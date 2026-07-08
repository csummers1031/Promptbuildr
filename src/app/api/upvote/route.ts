import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { upvotes, prompts } from "@/db/schema";
import { COOKIE_ANON, extractIp, visitorHash, verifyValue, type AnonData } from "@/lib/identity";

export const runtime = "nodejs";

/** POST /api/upvote { promptId } — 1 per prompt per visitor (composite PK). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const promptId = (body as { promptId?: unknown }).promptId;
  if (typeof promptId !== "string" || !promptId) {
    return NextResponse.json({ error: "promptId required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    // No persistence in preview mode — accept optimistically.
    return NextResponse.json({ status: "ok", persisted: false });
  }

  const anon = await verifyValue<AnonData>(req.cookies.get(COOKIE_ANON)?.value);
  const ip = extractIp(req.headers);
  const vhash = await visitorHash(anon?.id ?? "anon", ip);

  try {
    const inserted = await db
      .insert(upvotes)
      .values({ promptId, visitorHash: vhash })
      .onConflictDoNothing()
      .returning({ promptId: upvotes.promptId });
    // Only bump the denormalized counter on a genuinely new vote.
    if (inserted.length > 0) {
      await db
        .update(prompts)
        .set({ upvoteCount: sql`${prompts.upvoteCount} + 1` })
        .where(sql`${prompts.id} = ${promptId}`);
    }
    return NextResponse.json({ status: "ok", counted: inserted.length > 0 });
  } catch {
    return NextResponse.json({ error: "upvote failed" }, { status: 500 });
  }
}
