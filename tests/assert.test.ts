import { describe, it, expect } from "vitest";
import { evaluateCase } from "../scripts/eval/assert";
import type { EvalCase } from "../scripts/eval/cases";
import type { GenerationResult } from "@/lib/generate";
import type { ToolRef } from "@/lib/tools/resolve";

function okResult(over: Partial<{
  is_business: boolean;
  is_agent_or_automation: boolean;
  prompt: string;
  instructions: string[];
  category_tags: string[];
  recommended_tools: ToolRef[];
  moderationBlock: boolean;
}> = {}): GenerationResult {
  return {
    status: "ok",
    output: {
      title: "A reasonable title",
      prompt: over.prompt ?? "<context>You are an expert.</context>\n<task>Do the thing for [COMPANY].</task>\n<output_format>Structured.</output_format> ".repeat(3),
      instructions: over.instructions ?? ["Step one here", "Step two here", "Step three here"],
      recommended_tools: over.recommended_tools ?? [],
      category_tags: over.category_tags ?? ["a", "b"],
      is_business: over.is_business ?? true,
      is_agent_or_automation: over.is_agent_or_automation ?? false,
      moderation: { verdict: over.moderationBlock ? "block" : "allow", reason: null },
    },
    offRegistry: [],
    usage: { inputTokens: 1000, outputTokens: 500, estimatedCostUsd: 0.0035 },
  };
}

const businessXmlCase: EvalCase = {
  id: "t-biz",
  label: "business xml",
  input: { task: "x", role: "Marketer", aiTool: "Claude", outputType: "Strategy/Plan" },
  expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "xml" },
};

const personalCase: EvalCase = {
  id: "t-pers",
  label: "personal",
  input: { task: "x", role: "Personal Use", aiTool: "ChatGPT", outputType: "Strategy/Plan" },
  expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
};

describe("evaluateCase", () => {
  it("passes a well-formed business XML result", () => {
    const e = evaluateCase(businessXmlCase, okResult());
    expect(e.failures).toEqual([]);
  });

  it("flags wrong is_business classification", () => {
    const e = evaluateCase(businessXmlCase, okResult({ is_business: false }));
    expect(e.failures.some((f) => f.includes("is_business"))).toBe(true);
  });

  it("flags tools on a personal task", () => {
    const withTool = okResult({
      is_business: false,
      prompt: "## Section\nPlan the trip.".repeat(20),
      recommended_tools: [{ name: "Zapier", normalized: "zapier", registrySlug: "zapier", homepageUrl: null }],
    });
    const e = evaluateCase(personalCase, withTool);
    expect(e.failures.some((f) => f.includes("tool recommendations"))).toBe(true);
  });

  it("flags a Claude prompt missing XML tags", () => {
    const e = evaluateCase(businessXmlCase, okResult({ prompt: "Just plain prose, no tags at all. ".repeat(10) }));
    expect(e.failures.some((f) => f.includes("XML"))).toBe(true);
  });

  it("flags a blocked benign case", () => {
    const e = evaluateCase(businessXmlCase, okResult({ moderationBlock: true }));
    expect(e.failures.some((f) => f.includes("block"))).toBe(true);
  });

  it("treats a non-ok result as a failure", () => {
    const blocked: GenerationResult = { status: "blocked", stage: "blocklist-input", reason: "test" };
    const e = evaluateCase(businessXmlCase, blocked);
    expect(e.failures.length).toBeGreaterThan(0);
  });
});
