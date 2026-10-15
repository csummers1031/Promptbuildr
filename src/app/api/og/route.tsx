import { ImageResponse } from "next/og";

// OpenNext runs everything on workerd; no separate edge runtime needed.
export const dynamic = "force-dynamic";

/**
 * The Promptbuildr mark: a speech bubble whose silhouette reads as a "P", with
 * a ">" chevron knocked out (fillRule evenodd). Same path as <Logo />.
 */
const MARK =
  "M20 8 H44 A14 14 0 0 1 58 22 V34 A14 14 0 0 1 44 48 H16 L9 55 Q6 58 6 54 V22 A14 14 0 0 1 20 8 Z " +
  "M29.621 17.879 L37.621 25.879 A3 3 0 0 1 37.621 30.121 L29.621 38.121 A3 3 0 0 1 25.379 33.879 L31.257 28 L25.379 22.121 A3 3 0 0 1 29.621 17.879 Z";

function Mark({ size, fill, opacity = 1 }: { size: number; fill: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity }}>
      <path fill={fill} fillRule="evenodd" d={MARK} />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 800, letterSpacing: -0.5 }}>
      <span style={{ color: "#ffffff" }}>Prompt</span>
      <span style={{ color: "#c7d2fe" }}>buildr</span>
    </div>
  );
}

const GRADIENT = "linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#9333ea 100%)";

/**
 * Dynamic OG image. `variant=home` renders the branded hero card for the
 * homepage; otherwise a title/tag card for promoted + taxonomy pages.
 * next/og's ImageResponse (satori) is supported on workerd by the OpenNext
 * Cloudflare adapter.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const variant = searchParams.get("variant") || "";
  const title = (searchParams.get("title") || "AI prompt").slice(0, 120);
  const tag = (searchParams.get("tag") || "").slice(0, 40);

  // Shared decorative background: a large, faint brand mark bleeding off the
  // bottom-right corner so the card reads as "Promptbuildr" at a glance.
  const Backdrop = (
    <div style={{ display: "flex", position: "absolute", right: -120, bottom: -160 }}>
      <Mark size={620} fill="#ffffff" opacity={0.08} />
    </div>
  );

  if (variant === "home") {
    return new ImageResponse(
      (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "1200px",
            height: "630px",
            padding: "72px",
            background: GRADIENT,
            fontFamily: "sans-serif",
            overflow: "hidden",
          }}
        >
          {Backdrop}

          {/* Brand lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Mark size={78} fill="#ffffff" />
            <Wordmark size={46} />
          </div>

          {/* Hero headline, two-tone like the site */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: -20 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                fontSize: 86,
                fontWeight: 800,
                lineHeight: 1.03,
                letterSpacing: -2,
                color: "#ffffff",
              }}
            >
              <span style={{ display: "flex" }}>Turn any task into a&nbsp;</span>
              <span style={{ display: "flex", color: "#c7d2fe" }}>great AI prompt</span>
            </div>
          </div>

          {/* Tagline + domain */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 26px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                color: "#eef2ff",
                fontSize: 30,
                fontWeight: 600,
              }}
            >
              Ready-to-paste prompt + setup steps
            </div>
            <div style={{ display: "flex", color: "#ffffff", fontSize: 32, fontWeight: 700 }}>
              promptbuildr.ai
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  // Content card (promoted prompts + taxonomy pages).
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "1200px",
          height: "630px",
          padding: "72px",
          background: GRADIENT,
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {Backdrop}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark size={56} fill="#ffffff" />
          <Wordmark size={34} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {tag ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                color: "#eef2ff",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 24,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {tag}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", color: "#dbeafe", fontSize: 28, fontWeight: 600 }}>
          Ready-to-paste AI prompt · promptbuildr.ai
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
