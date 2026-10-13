import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { promoteEligiblePrompts } from "@/db/promote";
import { recordCronRun } from "@/db/repo";
import { pingIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";

/**
 * POST /api/cron/promote — backstop sweep: promote any published, un-promoted
 * prompts that clear the quality + dedup gates, then ping IndexNow with the new
 * URLs. (New prompts are also promoted inline at generation time; this catches
 * any that failed inline and re-pings.) Auth: Bearer CRON_SECRET.
 */
async function run(req: NextRequest) {
  if (!isAuthorizedCron(req)) return new NextResponse("unauthorized", { status: 401 });
  const startedAt = new Date();
  try {
    const { promotedUrls, checked, skipped } = await promoteEligiblePrompts(200);
    let indexNow: unknown = "skipped";
    if (promotedUrls.length > 0) indexNow = await pingIndexNow(promotedUrls);
    const detail = { checked, promoted: promotedUrls.length, skipped, indexNow };
    await recordCronRun("promote", startedAt, "ok", detail);
    return NextResponse.json({ ok: true, ...detail });
  } catch (e) {
    const message = (e as Error).message;
    await recordCronRun("promote", startedAt, "failed", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = run;
export const GET = run; // allow manual trigger via a GET with the bearer token
