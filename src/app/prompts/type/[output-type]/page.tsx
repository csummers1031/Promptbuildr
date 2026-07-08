import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { typeFromSlug, typeSlugs, taxonomyIntro } from "@/lib/feed/taxonomy";
import { OUTPUT_TYPES } from "@/config/constants";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return typeSlugs().map((type) => ({ "output-type": type }));
}

export async function generateMetadata({ params }: { params: Promise<{ "output-type": string }> }): Promise<Metadata> {
  const { "output-type": type } = await params;
  const label = typeFromSlug(type);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("type", label);
  return {
    title: `${h1} | Promptbuildr`,
    description: intro.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/prompts/type/${type}` },
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
