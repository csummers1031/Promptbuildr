import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { demoteEligiblePrompts } from "@/db/promote";
import { recordCronRun } from "@/db/repo";
import { pingIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";

/**
 * POST /api/cron/demote — deindex live pages that crossed the user-report
 * threshold (sets demoted_at → the page 404s and drops from the sitemap), then
 * ping IndexNow so engines recrawl and drop them. Auth: Bearer CRON_SECRET.
 */
async function run(req: NextRequest) {
  if (!isAuthorizedCron(req)) return new NextResponse("unauthorized", { status: 401 });
  const startedAt = new Date();
  try {
    const { demotedUrls, checked } = await demoteEligiblePrompts(3);
    let indexNow: unknown = "skipped";
    if (demotedUrls.length > 0) indexNow = await pingIndexNow(demotedUrls);
    const detail = { checked, demoted: demotedUrls.length, indexNow };
    await recordCronRun("demote", startedAt, "ok", detail);
    return NextResponse.json({ ok: true, ...detail });
  } catch (e) {
    const message = (e as Error).message;
    await recordCronRun("demote", startedAt, "failed", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = run;
export const GET = run;
