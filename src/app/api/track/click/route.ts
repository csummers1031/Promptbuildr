import { NextRequest, NextResponse } from "next/server";
import { hostFromUrl } from "@/lib/attribution";
import { extractIp, hashIp } from "@/lib/identity";
import { recordOutboundClick } from "@/db/analytics";
import { isBotRequest } from "@/lib/bots";

export const runtime = "nodejs";

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/** POST /api/track/click — outbound money-link clicks (sendBeacon). */
export async function POST(req: NextRequest) {
  if (isBotRequest(req.headers)) return new NextResponse(null, { status: 204 });
  let b: Record<string, unknown> = {};
  try {
    b = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const href = str(b.href);
  // Only record real outbound http(s) links (no javascript:/data: etc., capped).
  if (!href || href.length > 2048 || !/^https?:\/\//i.test(href)) {
    return new NextResponse(null, { status: 204 });
  }

  const ipHash = await hashIp(extractIp(req.headers)).catch(() => null);

  await recordOutboundClick({
    href,
    destHost: hostFromUrl(href),
    label: str(b.label),
    placement: str(b.placement),
    path: str(b.path),
    visitorHash: ipHash,
  });

  return new NextResponse(null, { status: 204 });
}
