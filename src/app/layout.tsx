import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";
import Tracker from "@/components/Tracker";

const DEFAULT_OG = `${SITE_URL}/api/og?variant=home`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Promptbuildr: AI prompt generator for any task",
    template: "%s",
  },
  description:
    "Describe what you want to do and get a high-quality, ready-to-use AI prompt with setup instructions, tuned for Claude, ChatGPT, Gemini, and more. Free.",
  // Durable Bing Webmaster verification (so it doesn't depend solely on the
  // Google Search Console import). Renders <meta name="msvalidate.01" ...>.
  verification: { other: { "msvalidate.01": "1BB856310F968F4C326A710B3978590C" } },
  openGraph: {
    siteName: "Promptbuildr",
    type: "website",
    // No `url` here: it would be inherited as the homepage URL by every page
    // that doesn't override openGraph, making taxonomy/legal shares unfurl and
    // canonicalize to the homepage. Each page sets its own og:url.
    images: [{ url: DEFAULT_OG, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        {children}
        <Tracker />
        {/* HubSpot tracking + analytics (Hacking Demand portal 23513958). Loads
            after the page is interactive so it never blocks first paint. */}
        <Script
          id="hs-script-loader"
          strategy="afterInteractive"
          src="https://js-na2.hs-scripts.com/23513958.js"
        />
      </body>
    </html>
  );
}
