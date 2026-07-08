import Link from "next/link";
import Footer from "@/components/Footer";
import FeedCard from "@/components/feed/FeedCard";
import type { FeedPrompt } from "@/lib/feed/types";
import {
  type TaxonomyKind,
  taxonomyIntro,
  taxonomyFaqs,
  taxonomySlug,
} from "@/lib/feed/taxonomy";
import { SITE_URL, faqJsonLd, breadcrumbJsonLd, orgJsonLd } from "@/lib/seo";

const KIND_PREFIX: Record<TaxonomyKind, string> = {
  for: "/prompts/for",
  tool: "/prompts/tool",
  type: "/prompts/type",
};

export default function TaxonomyView({
  kind,
  label,
  slug,
  prompts,
  siblings,
}: {
  kind: TaxonomyKind;
  label: string;
  slug: string;
  prompts: FeedPrompt[];
  /** other labels of the same kind, for lateral interlinking */
  siblings: string[];
}) {
  const { h1, intro } = taxonomyIntro(kind, label);
  const faqs = taxonomyFaqs(kind, label);
  const url = `${SITE_URL}${KIND_PREFIX[kind]}/${slug}`;

  const jsonLd = [
    orgJsonLd(),
    faqJsonLd(faqs),
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Prompts", url: `${SITE_URL}/prompts` },
      { name: label, url },
    ]),
  ];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Prompt<span className="text-indigo-600">buildr</span>
        </Link>
        <Link href="/#builder" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          Build a prompt
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-4">
        <nav className="mb-3 text-sm text-slate-500">
          <Link href="/prompts" className="hover:text-slate-800">Prompts</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{label}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{h1}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{intro}</p>

        <div className="mt-6 flex flex-col gap-3">
          {prompts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-slate-600">No prompts in this category yet.</p>
              <Link href="/#builder" className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-800">
                Build the first one →
              </Link>
            </div>
          ) : (
            prompts.map((p) => <FeedCard key={p.id} prompt={p} />)
          )}
        </div>

        {/* Lateral interlinking */}
        {siblings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Browse more
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s}
                  href={`${KIND_PREFIX[kind]}/${taxonomySlug(s)}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                >
                  {s}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* On-page FAQ (matches FAQPage schema) */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Frequently asked</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-slate-800">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
