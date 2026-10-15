import type { Metadata } from "next";
import BuilderForm from "@/components/BuilderForm";
import Footer from "@/components/Footer";
import Link from "next/link";
import Logo from "@/components/Logo";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { taxonomySlug } from "@/lib/feed/taxonomy";
import { orgJsonLd, webSiteJsonLd, SITE_URL } from "@/lib/seo";

interface HomeSearchParams {
  remix?: string;
  task?: string;
  role?: string;
  aiTool?: string;
  outputType?: string;
}

function pick(v: string | undefined, allowed: readonly string[]): string | undefined {
  return v && allowed.includes(v) ? v : undefined;
}

/**
 * When a shared remix link carries a task, render that task into the OG card so
 * the link unfurls with the actual prompt idea instead of the generic default.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // Home always self-canonicalizes to the clean apex root (drops ?remix=… etc.).
  const canonical = { alternates: { canonical: SITE_URL } };
  const task = sp.remix === "1" && typeof sp.task === "string" ? sp.task.slice(0, 100).trim() : "";
  if (!task) return canonical;
  const og = `${SITE_URL}/api/og?title=${encodeURIComponent(task)}&tag=${encodeURIComponent("AI prompt")}`;
  const title = `AI prompt: ${task}`;
  return {
    ...canonical,
    title,
    openGraph: { title, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  const initial =
    sp.remix === "1"
      ? {
          task: typeof sp.task === "string" ? sp.task.slice(0, 1000) : undefined,
          role: pick(sp.role, ROLES),
          aiTool: pick(sp.aiTool, AI_TOOLS),
          outputType: pick(sp.outputType, OUTPUT_TYPES),
        }
      : undefined;
  const jsonLd = [orgJsonLd(), webSiteJsonLd()];
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" aria-label="Promptbuildr home">
            <Logo />
          </Link>
          <Link href="/prompts" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Browse feed
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <section className="pb-4 pt-4 text-center sm:pb-8 sm:pt-10">
          <h1 className="mx-auto max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Turn what you want to do into a{" "}
            <span className="text-indigo-600">great AI prompt</span>
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-balance text-base text-slate-600 sm:mt-4 sm:text-lg">
            Describe your task, business or personal. Get a ready-to-paste prompt plus
            step-by-step setup, tuned for the AI tool you actually use.
          </p>
        </section>

        <section id="builder" className="scroll-mt-20">
          <BuilderForm initial={initial} />
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature title="For anything" body="Cold emails, trip plans, agents, speeches, spreadsheets. Any task, any purpose." />
          <Feature title="Tool-tuned" body="XML for Claude, clean sections for ChatGPT, code-ready for Cursor & Copilot, dense descriptors for image AI." />
          <Feature title="Ready to run" body="Copy the prompt, follow the steps, and go. No prompt-engineering degree required." />
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold text-slate-900">Browse prompts by category</h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore ready-made prompts by who they&apos;re for, the AI tool they&apos;re tuned for, or what they produce.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <CategoryGroup title="By AI tool" base="tool" labels={AI_TOOLS} />
            <CategoryGroup title="By role" base="for" labels={ROLES} />
            <CategoryGroup title="By output" base="type" labels={OUTPUT_TYPES} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CategoryGroup({
  title,
  base,
  labels,
}: {
  title: string;
  base: "for" | "tool" | "type";
  labels: readonly string[];
}) {
  // "Other" / "Other/Any" buckets aren't useful landing pages — skip them.
  const items = labels.filter((l) => l !== "Other" && l !== "Other/Any");
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((label) => (
          <li key={label}>
            <Link
              href={`/prompts/${base}/${taxonomySlug(label)}`}
              className="text-sm text-slate-600 hover:text-indigo-700"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
