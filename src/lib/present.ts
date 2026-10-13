import type { RawGenerationOutput } from "@/lib/prompt/schema";
import type { ToolRef, ResolvedToolLink } from "@/lib/tools/resolve";
import { renderTools, linkifyInstruction, type InstructionSegment } from "@/lib/tools/render";
import { selectCta, type CtaModule } from "@/lib/cta";
import { TOOLS, buildMarketplaceUrl, normalizeToolName } from "@/config/tools";

/**
 * Registry tool names that are also common English words. They're only linked
 * when the model explicitly recommends them — never auto-linked from the
 * registry — to avoid misfires like "Make sure…" or "Close the deal".
 */
const AMBIGUOUS_TOOL_NAMES = new Set(["Make", "Close", "Clay", "folk", "Gamma"]);

export interface PresentedGeneration {
  title: string;
  prompt: string;
  instructions: InstructionSegment[][];
  toolLinks: ResolvedToolLink[];
  cta: CtaModule | null;
  categoryTags: string[];
  isBusiness: boolean;
  aiTool: string;
}

type OutputWithRefs = Omit<RawGenerationOutput, "recommended_tools"> & {
  recommended_tools: ToolRef[];
};

/** Remove a leading "1. ", "2) ", "Step 3: " etc. so the UI owns numbering. */
export function stripLeadingEnumerator(step: string): string {
  return step.replace(/^\s*(?:step\s*)?\d{1,2}\s*[.):\-]\s+/i, "").trim();
}

/** Build the client-facing DTO: resolve links, linkify steps, pick the CTA. */
export function presentGeneration(
  output: OutputWithRefs,
  ctx: { role: string; outputType: string; aiTool: string },
): PresentedGeneration {
  const { links, campaign } = renderTools(output.recommended_tools, output.category_tags);

  // Augment inline linking with any registry tool mentioned in the steps, so a
  // tool we can monetize is clickable even when the model didn't formally
  // recommend it. Recommended links win on name collisions; registry additions
  // match the exact brand capitalization to avoid common-word misfires.
  const recommendedNames = new Set(links.map((l) => normalizeToolName(l.name)));
  const caseSensitiveNames = new Set<string>();
  const registryLinks: ResolvedToolLink[] = [];
  for (const t of TOOLS) {
    if (AMBIGUOUS_TOOL_NAMES.has(t.name)) continue;
    if (recommendedNames.has(normalizeToolName(t.name))) continue;
    registryLinks.push({ name: t.name, href: buildMarketplaceUrl(t, campaign), source: "registry" });
    caseSensitiveNames.add(t.name);
  }
  const linkPool = [...links, ...registryLinks];

  // Strip any leading enumerator the model added ("1. ", "2) ", "Step 3: ")
  // since the UI renders its own numbered badges.
  const instructions = output.instructions.map((step) =>
    linkifyInstruction(stripLeadingEnumerator(step), linkPool, { caseSensitiveNames }),
  );
  const cta = selectCta({
    isBusiness: output.is_business,
    isAgentOrAutomation: output.is_agent_or_automation,
    outputType: ctx.outputType,
    role: ctx.role,
    categoryTags: output.category_tags,
    campaign,
  });

  return {
    title: output.title,
    prompt: output.prompt,
    instructions,
    toolLinks: links,
    cta,
    categoryTags: output.category_tags,
    isBusiness: output.is_business,
    aiTool: ctx.aiTool,
  };
}
