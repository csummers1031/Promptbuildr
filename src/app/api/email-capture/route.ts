import { NextRequest, NextResponse } from "next/server";
import { ROLES } from "@/config/constants";
import { COOKIE_SESSION, signValue, type SessionData } from "@/lib/identity";
import { upsertUser } from "@/db/repo";
import { getCrmSync } from "@/lib/crm";

export const runtime = "nodejs";

const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/email-capture — email + role unlocks unlimited (rate-capped)
 * generation. Persists the user (when DB present), pushes to HubSpot (when
 * configured), and issues a signed session cookie either way so the gate lifts.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const role = typeof b.role === "string" ? b.role : "";

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Please pick your role." }, { status: 400 });
  }

  // Persist (no-op without DB) and fabricate a stable id for the session.
  const user = await upsertUser(email, role);
  const userId = user?.id ?? `anon-${btoa(email).replace(/=/g, "")}`;

  // Fire-and-forget CRM sync (stub when HubSpot unconfigured).
  getCrmSync()
    .syncContact({ email, role, categoriesUsed: [] })
    .catch((e) => console.error("crm sync failed:", e));

  const session = await signValue<SessionData>({ userId, email, role });
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(COOKIE_SESSION, session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
