import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { roleFromSlug, roleSlugs } from "@/lib/feed/taxonomy";
import { taxonomyIntro } from "@/lib/feed/taxonomy";
import { ROLES } from "@/config/constants";
import { SITE_URL, clampForMeta } from "@/lib/seo";

// ISR: regenerate hourly so newly promoted prompts surface here without a redeploy.
export const revalidate = 3600;

export function generateStaticParams() {
  return roleSlugs().map((role) => ({ role }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const label = roleFromSlug(role);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("for", label);
  // Don't index a near-empty category page (Google's thin/scaled-content risk);
  // it flips to indexable automatically once it holds ≥2 prompts.
  const sample = await getFeed({ sort: "all", role: label, limit: 2, offset: 0 }, new Date());
  const url = `${SITE_URL}/prompts/for/${role}`;
  return {
    title: `${h1} | Promptbuildr`,
    description: clampForMeta(intro),
    alternates: { canonical: url },
    robots: { index: label !== "Other" && sample.length >= 2, follow: true },
    openGraph: { url, title: h1, description: clampForMeta(intro) },
  };
}

export default async function RoleTaxonomy({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const label = roleFromSlug(role);
  if (!label) notFound();
  const prompts = await getFeed({ sort: "all", role: label, limit: 24, offset: 0 }, new Date());
  return (
    <TaxonomyView
      kind="for"
      label={label}
      slug={role}
      prompts={prompts}
      siblings={ROLES.filter((r) => r !== label)}
    />
  );
}
