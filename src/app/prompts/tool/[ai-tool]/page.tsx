import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { toolFromSlug, toolSlugs, taxonomyIntro } from "@/lib/feed/taxonomy";
import { AI_TOOLS } from "@/config/constants";
import { SITE_URL, clampForMeta } from "@/lib/seo";

// ISR: regenerate hourly so newly promoted prompts surface here without a redeploy.
export const revalidate = 3600;

export function generateStaticParams() {
  return toolSlugs().map((tool) => ({ "ai-tool": tool }));
}

export async function generateMetadata({ params }: { params: Promise<{ "ai-tool": string }> }): Promise<Metadata> {
  const { "ai-tool": tool } = await params;
  const label = toolFromSlug(tool);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("tool", label);
  // Don't index a near-empty category page; flips to indexable at ≥2 prompts.
  const sample = await getFeed({ sort: "all", aiTool: label, limit: 2, offset: 0 }, new Date());
  return {
    title: `${h1} | Promptbuildr`,
    description: clampForMeta(intro),
    alternates: { canonical: `${SITE_URL}/prompts/tool/${tool}` },
    robots: { index: sample.length >= 2, follow: true },
  };
}

export default async function ToolTaxonomy({ params }: { params: Promise<{ "ai-tool": string }> }) {
  const { "ai-tool": tool } = await params;
  const label = toolFromSlug(tool);
  if (!label) notFound();
  const prompts = await getFeed({ sort: "all", aiTool: label, limit: 24, offset: 0 }, new Date());
  return (
    <TaxonomyView
      kind="tool"
      label={label}
      slug={tool}
      prompts={prompts}
      siblings={AI_TOOLS.filter((t) => t !== label)}
    />
  );
}
