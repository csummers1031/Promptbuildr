import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy | Promptbuildr",
  description: "How Promptbuildr collects, uses, and protects your data.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="max-w-none text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <p className="mt-6">
          Promptbuildr (&quot;we&quot;) is operated by Hacking Demand. This policy explains what we
          collect and why. We keep it minimal.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">What we collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong>Your email and role</strong>, if you provide them to unlock unlimited prompt generation.</li>
          <li><strong>The prompts you generate</strong>, including the task you describe. By default, generated prompts may appear in our public feed; nothing that identifies you personally is attached.</li>
          <li><strong>Basic usage data</strong> — a cookie identifier and a one-way hashed version of your IP address (we never store your raw IP), used to rate-limit free usage and prevent abuse.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">How we use it</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>To provide and improve the product.</li>
          <li>To enforce fair usage limits.</li>
          <li>To send occasional email — such as a weekly best-of-prompts newsletter — if you gave us your email. You can unsubscribe from any email.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Who we share it with</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong>Anthropic</strong> — the text you submit is processed by Anthropic&apos;s API to generate your prompt.</li>
          <li><strong>Our email/CRM provider (HubSpot)</strong> — to store your email and send newsletters, if you opted in.</li>
          <li>We do not sell your personal data.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Your choices</h2>
        <p className="mt-3">
          You can unsubscribe from emails at any time, and you can request access to or deletion of
          your data by emailing us. To exclude a prompt from the public feed, or to request removal,
          contact us.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p className="mt-3">
          Email <a href="mailto:charles@hackingdemand.com" className="underline">charles@hackingdemand.com</a> with any privacy question or request.
        </p>
      </article>
    </PageShell>
  );
}
