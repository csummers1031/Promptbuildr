import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonomyView from "@/components/feed/TaxonomyView";
import { getFeed } from "@/db/feed";
import { roleFromSlug, roleSlugs } from "@/lib/feed/taxonomy";
import { taxonomyIntro } from "@/lib/feed/taxonomy";
import { ROLES } from "@/config/constants";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return roleSlugs().map((role) => ({ role }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const label = roleFromSlug(role);
  if (!label) return { title: "Not found" };
  const { h1, intro } = taxonomyIntro("for", label);
  return {
    title: `${h1} | Promptbuildr`,
    description: intro.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/prompts/for/${role}` },
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
