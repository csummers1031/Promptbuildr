import { NextRequest, NextResponse } from "next/server";
import { classifyTraffic, hostFromUrl } from "@/lib/attribution";
import { extractIp, hashIp } from "@/lib/identity";
import { recordVisit } from "@/db/analytics";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/** POST /api/track/visit — first-party landing attribution (client beacon). */
export async function POST(req: NextRequest) {
  let b: Record<string, unknown> = {};
  try {
    b = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const utm = (b.utm ?? {}) as Record<string, unknown>;
  const referrer = str(b.referrer);
  const utmSource = str(utm.source);
  const utmMedium = str(utm.medium);

  const selfHost = hostFromUrl(SITE_URL);
  const { channel, aiSource, referrerHost } = classifyTraffic({
    referrer,
    utmSource,
    utmMedium,
    selfHost,
  });

  const ipHash = await hashIp(extractIp(req.headers)).catch(() => null);

  await recordVisit({
    path: str(b.path) ?? "/",
    referrer,
    referrerHost,
    channel,
    aiSource,
    utmSource,
    utmMedium,
    utmCampaign: str(utm.campaign),
    utmTerm: str(utm.term),
    utmContent: str(utm.content),
    country: req.headers.get("cf-ipcountry"),
    visitorHash: ipHash,
  });

  return new NextResponse(null, { status: 204 });
}
