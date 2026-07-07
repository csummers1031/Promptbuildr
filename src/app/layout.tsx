import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promptbuildr — AI prompt generator",
  description:
    "Describe what you want to do and get a high-quality, ready-to-use AI prompt with setup instructions.",
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
