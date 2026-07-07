import { describe, it, expect } from "vitest";
import { validateGenerationOutput } from "@/lib/prompt/schema";

const valid = {
  title: "Cold email sequence",
  prompt: "You are an expert SDR...",
  instructions: ["Paste this into ChatGPT", "Fill in [COMPANY]", "Iterate on tone"],
  recommended_tools: [{ name: "Instantly", registry_slug: "instantly", homepage_url: null }],
  category_tags: ["cold-outbound", "sales"],
  is_business: true,
  is_agent_or_automation: false,
  moderation: { verdict: "allow", reason: null },
};

describe("validateGenerationOutput", () => {
  it("accepts a well-formed object", () => {
    const r = validateGenerationOutput(valid);
    expect(r.ok).toBe(true);
  });
  it("rejects a non-object", () => {
    expect(validateGenerationOutput("nope").ok).toBe(false);
  });
  it("rejects missing prompt", () => {
    const { prompt, ...rest } = valid;
    void prompt;
    const r = validateGenerationOutput(rest);
    expect(r.ok).toBe(false);
  });
  it("rejects empty instructions", () => {
    const r = validateGenerationOutput({ ...valid, instructions: [] });
    expect(r.ok).toBe(false);
  });
  it("rejects a bad moderation verdict", () => {
    const r = validateGenerationOutput({ ...valid, moderation: { verdict: "maybe", reason: null } });
    expect(r.ok).toBe(false);
  });
  it("rejects non-boolean is_business", () => {
    const r = validateGenerationOutput({ ...valid, is_business: "yes" });
    expect(r.ok).toBe(false);
  });
});
