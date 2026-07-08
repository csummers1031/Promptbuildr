import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import FeedCard from "@/components/feed/FeedCard";
import { getFeed } from "@/db/feed";
import { SORTS, SORT_LABELS, parseSort, type Sort } from "@/lib/feed/types";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { SITE_URL, orgJsonLd, webSiteJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Prompt Feed — the best prompts, ranked | Promptbuildr",
  description:
    "Browse and upvote the best AI prompts for business and personal tasks. Filter by role, AI tool, and output type. Copy, remix, and run them in Claude, ChatGPT, Gemini, and more.",
  alternates: { canonical: `${SITE_URL}/prompts` },
};

const PAGE_SIZE = 24;

interface SearchParams {
  sort?: string;
  role?: string;
  tool?: string;
  type?: string;
  page?: string;
}

function buildHref(base: SearchParams, patch: Partial<SearchParams>): string {
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/prompts?${qs}` : "/prompts";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const now = new Date();

  const prompts = await getFeed(
    {
      sort,
      role: sp.role,
      aiTool: sp.tool,
      outputType: sp.type,
      limit: PAGE_SIZE + 1,
      offset: (page - 1) * PAGE_SIZE,
    },
    now,
  );
  const hasMore = prompts.length > PAGE_SIZE;
  const shown = prompts.slice(0, PAGE_SIZE);

  const jsonLd = [
    orgJsonLd(),
    webSiteJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Prompts", url: `${SITE_URL}/prompts` },
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Prompt Feed</h1>
          <p className="mt-1 text-slate-600">
            The best AI prompts for business and personal tasks — upvoted by the community. Copy,
            remix, and run them in your tool of choice.
          </p>
        </div>

        {/* Sort tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SORTS.map((s: Sort) => (
            <Link
              key={s}
              href={buildHref(sp, { sort: s, page: undefined })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                sort === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {SORT_LABELS[s]}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 text-sm">
          <FilterSelect label="Role" name="role" value={sp.role} options={ROLES} sp={sp} />
          <FilterSelect label="AI tool" name="tool" value={sp.tool} options={AI_TOOLS} sp={sp} />
          <FilterSelect label="Output" name="type" value={sp.type} options={OUTPUT_TYPES} sp={sp} />
          {(sp.role || sp.tool || sp.type) && (
            <Link href={buildHref({ sort }, {})} className="self-center text-slate-500 underline hover:text-slate-800">
              Clear filters
            </Link>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-slate-600">No prompts here yet.</p>
            <Link href="/#builder" className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-800">
              Be the first — build one →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((p) => (
              <FeedCard key={p.id} prompt={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="mt-6 flex items-center justify-between">
            {page > 1 ? (
              <Link href={buildHref(sp, { page: String(page - 1) })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {hasMore && (
              <Link href={buildHref(sp, { page: String(page + 1) })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Next →
              </Link>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** A GET-form filter dropdown that navigates on change via native form submit. */
function FilterSelect({
  label,
  name,
  value,
  options,
  sp,
}: {
  label: string;
  name: keyof SearchParams;
  value: string | undefined;
  options: readonly string[];
  sp: SearchParams;
}) {
  // Render as links inside a details menu to stay SSR + no client JS.
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400">
        {label}: <span className="font-medium">{value ?? "All"}</span>
      </summary>
      <div className="absolute z-10 mt-1 max-h-72 w-56 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
        <Link href={buildHref(sp, { [name]: undefined, page: undefined })} className="block rounded px-2 py-1.5 hover:bg-slate-100">
          All
        </Link>
        {options.map((o) => (
          <Link
            key={o}
            href={buildHref(sp, { [name]: o, page: undefined })}
            className={`block rounded px-2 py-1.5 hover:bg-slate-100 ${value === o ? "font-semibold text-indigo-700" : ""}`}
          >
            {o}
          </Link>
        ))}
      </div>
    </details>
  );
}
