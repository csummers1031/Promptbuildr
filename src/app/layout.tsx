import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

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
