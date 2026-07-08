import { ImageResponse } from "next/og";

// OpenNext runs everything on workerd; no separate edge runtime needed.
export const dynamic = "force-dynamic";

/**
 * Dynamic OG image for promoted + taxonomy pages. Branded template, title +
 * category on a gradient. Uses next/og's ImageResponse (satori under the hood),
 * which the OpenNext Cloudflare adapter supports on workerd.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "AI prompt").slice(0, 120);
  const tag = (searchParams.get("tag") || "").slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "1200px",
          height: "630px",
          padding: "70px",
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", color: "#e0e7ff", fontSize: 34, fontWeight: 700 }}>
          Promptbuildr
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {tag ? (
            <div
              style={{
                display: "flex",
                color: "#c7d2fe",
                fontSize: 26,
                marginBottom: 18,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {tag}
            </div>
          ) : null}
          <div style={{ display: "flex", color: "#ffffff", fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>
        <div style={{ display: "flex", color: "#c7d2fe", fontSize: 26 }}>
          Ready-to-paste AI prompt · promptbuildr.ai
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
