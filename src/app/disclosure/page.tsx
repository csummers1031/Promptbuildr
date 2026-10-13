import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Promptbuildr",
  description: "How Promptbuildr uses affiliate links and earns commissions.",
  alternates: { canonical: `${SITE_URL}/disclosure` },
};

export default function DisclosurePage() {
  return (
    <PageShell>
      <article className="max-w-none text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Affiliate Disclosure</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <p className="mt-6">
          Promptbuildr is free to use. To support the service, some of the tools we recommend —
          in generated prompt instructions, on prompt pages, in the feed, and while a prompt is
          generating — are linked with affiliate (&quot;sponsored&quot;) links.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">What that means</h2>
        <p className="mt-3">
          If you click one of these links and sign up for or purchase a product, we may earn a
          commission, at <strong>no additional cost to you</strong>. In some cases the link may
          also get you a discount. These commissions help keep Promptbuildr free.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">How we choose what to recommend</h2>
        <p className="mt-3">
          Tool recommendations are based on how well a tool fits the task you described — not on
          whether it pays a commission. Many tools we link to have no affiliate program at all. We
          only suggest tools we believe are genuinely useful for the job.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Operator</h2>
        <p className="mt-3">
          Promptbuildr is operated by Hacking Demand. Questions? Email{" "}
          <a href="mailto:charles@hackingdemand.com" className="underline">charles@hackingdemand.com</a>.
        </p>
      </article>
    </PageShell>
  );
}
