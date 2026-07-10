import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { SITE_URL } from "@/lib/seo";
import { HD } from "@/config/branding";

export const metadata: Metadata = {
  title: "About Promptbuildr",
  description:
    "Promptbuildr turns plain-language tasks into high-quality, ready-to-use AI prompts for business and personal use. Free, powered by Hacking Demand.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <PageShell>
      <article className="prose prose-slate max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">About Promptbuildr</h1>
        <p className="mt-4 text-slate-700">
          Promptbuildr turns a plain-language description of what you&apos;re trying to do into a
          high-quality, ready-to-paste AI prompt — plus step-by-step setup instructions, tuned for
          the AI tool you actually use. It works for business tasks and personal ones alike, and
          it&apos;s completely free.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li>Describe your task and pick your role, AI tool, and desired output.</li>
          <li>We generate a prompt built with real prompt-engineering best practices.</li>
          <li>Copy it, follow the setup steps, and run it in Claude, ChatGPT, Gemini, and more.</li>
        </ol>
        <p className="mt-6 text-slate-700">
          The best community-submitted prompts flow into our{" "}
          <Link href="/prompts" className="font-medium text-indigo-600 hover:text-indigo-800">
            public feed
          </Link>{" "}
          where anyone can browse, upvote, and remix them.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-slate-900">Who&apos;s behind it</h2>
        <p className="mt-3 text-slate-700">
          Promptbuildr is built and operated by{" "}
          <a href={HD.home} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800">
            Hacking Demand
          </a>
          , a demand-generation studio that helps teams build and run AI-powered growth systems.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Questions? Email{" "}
          <a href="mailto:charles@hackingdemand.com" className="underline">charles@hackingdemand.com</a>.
        </p>
      </article>
    </PageShell>
  );
}
