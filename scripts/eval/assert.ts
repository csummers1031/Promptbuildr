/**
 * Pure assertion logic for eval cases — no API dependency, unit-testable.
 */
import type { GenerationResult } from "@/lib/generate";
import { getToolBySlug } from "@/config/tools";
import type { EvalCase } from "./cases";

export interface CaseEvaluation {
  id: string;
  failures: string[];
  warnings: string[];
}

export function evaluateCase(c: EvalCase, result: GenerationResult): CaseEvaluation {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (result.status !== "ok") {
    failures.push(
      result.status === "blocked"
        ? `benign case was blocked (${result.stage}: ${result.reason})`
        : `generation errored: ${result.reason}`,
    );
    return { id: c.id, failures, warnings };
  }

  const out = result.output;

  // Classification flags
  if (out.is_business !== c.expect.isBusiness) {
    failures.push(`is_business=${out.is_business}, expected ${c.expect.isBusiness}`);
  }
  if (out.is_agent_or_automation !== c.expect.isAgentOrAutomation) {
    failures.push(`is_agent_or_automation=${out.is_agent_or_automation}, expected ${c.expect.isAgentOrAutomation}`);
  }

  // Moderation: all eval cases are benign
  if (out.moderation.verdict !== "allow") {
    failures.push(`moderation verdict "block" on a benign case: ${out.moderation.reason}`);
  }

  // Tool recommendations
  if (!c.expect.allowTools && out.recommended_tools.length > 0) {
    failures.push(
      `personal task got tool recommendations: ${out.recommended_tools.map((t) => t.name).join(", ")}`,
    );
  }
  for (const ref of out.recommended_tools) {
    if (ref.registrySlug && !getToolBySlug(ref.registrySlug)) {
      failures.push(`invented registry slug survived validation: ${ref.registrySlug}`);
    }
  }

  // Structural quality
  if (out.title.length > 90) warnings.push(`title is long (${out.title.length} chars)`);
  if (out.prompt.length < 200) failures.push(`prompt suspiciously short (${out.prompt.length} chars)`);
  if (out.instructions.length < 3 || out.instructions.length > 6) {
    failures.push(`instructions count ${out.instructions.length}, expected 3-6`);
  }
  if (out.category_tags.length < 2 || out.category_tags.length > 4) {
    warnings.push(`category_tags count ${out.category_tags.length}, expected 2-4`);
  }

  // Tool-appropriate syntax
  const hasXmlTags = /<[a-z_]+>[\s\S]*<\/[a-z_]+>/i.test(out.prompt);
  const hasMarkdownHeaders = /^#{1,3}\s|\*\*[^*]+\*\*/m.test(out.prompt);
  switch (c.expect.syntax) {
    case "xml":
      if (!hasXmlTags) failures.push("Claude-target prompt has no XML section tags");
      break;
    case "markdown":
      if (hasXmlTags) warnings.push("non-Claude target prompt uses XML tags");
      break;
    case "image":
      if (hasXmlTags || hasMarkdownHeaders) {
        failures.push("image prompt should be a dense descriptor string, not sectioned XML/markdown");
      }
      break;
  }

  // Placeholder hygiene: business prompts should elicit user specifics
  if (c.expect.isBusiness && !/\[[A-Z][A-Z0-9 _/-]{2,}\]/.test(out.prompt)) {
    warnings.push("business prompt contains no [PLACEHOLDER] context slots");
  }

  return { id: c.id, failures, warnings };
}
