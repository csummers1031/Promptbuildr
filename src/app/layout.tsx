import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

const DEFAULT_OG = `${SITE_URL}/api/og?title=${encodeURIComponent("Turn any task into a great AI prompt")}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Promptbuildr — AI prompt generator for any task",
    template: "%s",
  },
  description:
    "Describe what you want to do and get a high-quality, ready-to-use AI prompt with setup instructions — tuned for Claude, ChatGPT, Gemini, and more. Free.",
  openGraph: {
    siteName: "Promptbuildr",
    type: "website",
    url: SITE_URL,
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
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
