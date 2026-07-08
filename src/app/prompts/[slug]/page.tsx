import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import CopyButton from "@/components/CopyButton";
import { getPromptBySlug, getRelatedPrompts } from "@/db/feed";
import { resolveToolLink } from "@/lib/tools/resolve";
import { selectCta } from "@/lib/cta";
import { taxonomySlug } from "@/lib/feed/taxonomy";
import {
  SITE_URL,
  howToJsonLd,
  breadcrumbJsonLd,
  orgJsonLd,
  directAnswer,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug, new Date());
  if (!prompt) return { title: "Prompt not found | Promptbuildr" };
  const title = `${prompt.title} — ${prompt.aiTool} prompt`;
  const description = directAnswer(prompt.role, prompt.outputType, prompt.title).slice(0, 155);
  const url = `${SITE_URL}/prompts/${slug}`;
  const og = `${SITE_URL}/api/og?title=${encodeURIComponent(prompt.title)}&tag=${encodeURIComponent(prompt.categoryTags[0] ?? prompt.outputType)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function PromotedPromptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const now = new Date();
  const prompt = await getPromptBySlug(slug, now);
  // Missing or demoted -> 404 (deindex). Demotion intent per spec was 410;
  // App Router serves 404 here, which also removes the page from the index.
  if (!prompt) notFound();

  const related = await getRelatedPrompts(prompt, now);
  const campaign = prompt.categoryTags[0] ?? "general";
  const toolLinks = prompt.isBusiness
    ? prompt.recommendedTools.map((r) => resolveToolLink(r, campaign)).filter((l) => l.href)
    : [];
  const cta = selectCta({
    isBusiness: prompt.isBusiness,
    isAgentOrAutomation: prompt.isAgentOrAutomation,
    outputType: prompt.outputType,
    role: prompt.role,
    categoryTags: prompt.categoryTags,
    campaign,
  });
  const url = `${SITE_URL}/prompts/${slug}`;

  const jsonLd = [
    orgJsonLd(),
    howToJsonLd({ name: prompt.title, description: prompt.title, url, steps: prompt.instructions }),
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Prompts", url: `${SITE_URL}/prompts` },
      { name: prompt.title, url },
    ]),
  ];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Prompt<span className="text-indigo-600">buildr</span>
        </Link>
        <Link href="/prompts" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          Browse feed
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <nav className="mb-3 text-sm text-slate-500">
          <Link href="/prompts" className="hover:text-slate-800">Prompts</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/prompts/type/${taxonomySlug(prompt.outputType)}`} className="hover:text-slate-800">
            {prompt.outputType}
          </Link>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{prompt.title}</h1>

        {/* Direct-answer summary (AEO, above the fold) */}
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-700">
          {directAnswer(prompt.role, prompt.outputType, prompt.title)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link href={`/prompts/for/${taxonomySlug(prompt.role)}`} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
            {prompt.role}
          </Link>
          <Link href={`/prompts/tool/${taxonomySlug(prompt.aiTool)}`} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
            {prompt.aiTool}
          </Link>
          <Link href={`/prompts/type/${taxonomySlug(prompt.outputType)}`} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
            {prompt.outputType}
          </Link>
        </div>

        {/* Prompt in a labeled pre block */}
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">The prompt</h2>
            <CopyButton text={prompt.promptText} />
          </div>
          <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800">
            {prompt.promptText}
          </pre>
        </section>

        {/* Instructions (HowTo steps) */}
        {prompt.instructions.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">How to use it</h2>
            <ol className="flex flex-col gap-2.5">
              {prompt.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        )}

        {toolLinks.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended tools</h2>
            <div className="flex flex-wrap gap-2">
              {toolLinks.map((t) => (
                <a key={t.name} href={t.href!} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700">
                  {t.name} <span aria-hidden className="text-slate-400">↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {cta && (
          <section className={`mt-6 rounded-xl border p-5 ${cta.kind === "agent-build" ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
            <h2 className="text-base font-semibold text-slate-900">{cta.heading}</h2>
            <p className="mt-1 text-sm text-slate-600">{cta.body}</p>
            <a href={cta.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              {cta.ctaLabel} <span aria-hidden>→</span>
            </a>
          </section>
        )}

        {/* Related prompts (internal linking) */}
        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Related prompts</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) =>
                r.slug ? (
                  <Link key={r.id} href={`/prompts/${r.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
                    <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{r.role} · {r.aiTool}</p>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-sm text-slate-600">Want a prompt tailored to your exact task?</p>
          <Link href={`/?remix=1&task=${encodeURIComponent(prompt.title)}&role=${encodeURIComponent(prompt.role)}&aiTool=${encodeURIComponent(prompt.aiTool)}&outputType=${encodeURIComponent(prompt.outputType)}`} className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-800">
            Remix this in the builder →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
