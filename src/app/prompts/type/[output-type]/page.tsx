import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { typeFromSlug, typeSlugs, taxonomyIntro } from "@/lib/feed/taxonomy";
import { OUTPUT_TYPES } from "@/config/constants";
import { SITE_URL, clampForMeta } from "@/lib/seo";

// ISR: regenerate hourly so newly promoted prompts surface here without a redeploy.
export const revalidate = 3600;

export function generateStaticParams() {
  return typeSlugs().map((type) => ({ "output-type": type }));
}

export async function generateMetadata({ params }: { params: Promise<{ "output-type": string }> }): Promise<Metadata> {
  const { "output-type": type } = await params;
  const label = typeFromSlug(type);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("type", label);
  // Don't index a near-empty category page; flips to indexable at ≥2 prompts.
  const sample = await getFeed({ sort: "all", outputType: label, limit: 2, offset: 0 }, new Date());
  return {
    title: `${h1} | Promptbuildr`,
    description: clampForMeta(intro),
    alternates: { canonical: `${SITE_URL}/prompts/type/${type}` },
    robots: { index: sample.length >= 2, follow: true },
  };
}

export default async function TypeTaxonomy({ params }: { params: Promise<{ "output-type": string }> }) {
  const { "output-type": type } = await params;
  const label = typeFromSlug(type);
  if (!label) notFound();
  const prompts = await getFeed({ sort: "all", outputType: label, limit: 24, offset: 0 }, new Date());
  return (
    <TaxonomyView
      kind="type"
      label={label}
      slug={type}
      prompts={prompts}
      siblings={OUTPUT_TYPES.filter((t) => t !== label)}
    />
  );
}
