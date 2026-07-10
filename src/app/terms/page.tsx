import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use | Promptbuildr",
  description: "The terms that govern your use of Promptbuildr.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <PageShell>
      <article className="max-w-none text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <p className="mt-6">
          By using Promptbuildr you agree to these terms. Promptbuildr is operated by Hacking Demand.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">The service</h2>
        <p className="mt-3">
          Promptbuildr generates AI prompts and setup instructions. It&apos;s free to use. We may
          change, limit, or discontinue features at any time.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Acceptable use</h2>
        <p className="mt-3">
          Don&apos;t use Promptbuildr to create content that is illegal, harmful, hateful,
          sexually explicit, or that targets or endangers others, and don&apos;t attempt to misuse
          or abuse the service (including scraping or evading usage limits). We screen submissions
          and remove content that violates these rules.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Your prompts</h2>
        <p className="mt-3">
          Prompts you generate are yours to use. By generating a prompt you grant us a license to
          display it in our public feed and on prompt pages, unless you ask us to remove it. You are
          responsible for how you use generated prompts and their output.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">No warranty</h2>
        <p className="mt-3">
          Promptbuildr is provided &quot;as is,&quot; without warranties of any kind. AI output can
          be inaccurate — review it before relying on it. To the extent permitted by law, we are not
          liable for damages arising from your use of the service.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p className="mt-3">
          Questions? Email <a href="mailto:charles@hackingdemand.com" className="underline">charles@hackingdemand.com</a>.
        </p>
      </article>
    </PageShell>
  );
}
