import { NextRequest, NextResponse } from "next/server";
import { recordPromptView } from "@/db/analytics";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST /api/view — count a prompt view (client beacon, deduped per session). */
export async function POST(req: NextRequest) {
  let b: Record<string, unknown> = {};
  try {
    b = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const id = typeof b.promptId === "string" ? b.promptId : "";
  if (!UUID.test(id)) return new NextResponse(null, { status: 204 });
  await recordPromptView(id);
  return new NextResponse(null, { status: 204 });
}
