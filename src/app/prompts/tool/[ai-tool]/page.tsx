import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { toolFromSlug, toolSlugs, taxonomyIntro } from "@/lib/feed/taxonomy";
import { AI_TOOLS } from "@/config/constants";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return toolSlugs().map((tool) => ({ "ai-tool": tool }));
}

export async function generateMetadata({ params }: { params: Promise<{ "ai-tool": string }> }): Promise<Metadata> {
  const { "ai-tool": tool } = await params;
  const label = toolFromSlug(tool);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("tool", label);
  return {
    title: `${h1} | Promptbuildr`,
    description: intro.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/prompts/tool/${tool}` },
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
