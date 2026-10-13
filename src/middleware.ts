import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Host canonicalization (SEO Tier 1):
 * - www.promptbuildr.ai  -> 301 to the apex (promptbuildr.ai), preserving path + query.
 *   Prevents www/apex serving identical content as two indexable hosts.
 * - *.workers.dev (the staging URL) -> served but marked `noindex, nofollow`
 *   via X-Robots-Tag, so the staging deploy never competes with production in
 *   search. We noindex rather than redirect so staging stays usable for testing.
 *
 * The apex host passes straight through.
 */
const APEX_HOST = "promptbuildr.ai";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();

  // www -> apex, permanent redirect, keep the full path + query string.
  if (host === `www.${APEX_HOST}`) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = APEX_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Staging host: let it serve, but keep it out of every index.
  if (host.endsWith(".workers.dev")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next's internal static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
