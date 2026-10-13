import { describe, it, expect } from "vitest";
import { presentGeneration } from "@/lib/present";
import type { ToolRef } from "@/lib/tools/resolve";

function ref(partial: Partial<ToolRef> & { name: string }): ToolRef {
  return {
    normalized: partial.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    registrySlug: null,
    homepageUrl: null,
    ...partial,
  };
}

function build(instructions: string[], recommended: ToolRef[] = [], isBusiness = true) {
  return presentGeneration(
    {
      title: "Test",
      prompt: "x",
      instructions,
      recommended_tools: recommended,
      category_tags: ["cold-outbound"],
      is_business: isBusiness,
      is_agent_or_automation: true,
      moderation: { verdict: "allow", reason: null },
    },
    { role: "Sales/SDR", outputType: "Email/Outreach", aiTool: "Claude" },
  );
}

function linkHrefs(segments: { type: string; href?: string; value: string }[]) {
  return segments.filter((s) => s.type === "link").map((s) => ({ value: s.value, href: s.href }));
}

describe("presentGeneration — inline tool linking", () => {
  it("links a registry tool mentioned in steps even when not recommended", () => {
    const out = build(["Use Zapier to connect the apps, then paste into Claude."]);
    const links = linkHrefs(out.instructions[0]);
    const names = links.map((l) => l.value);
    expect(names).toContain("Zapier");
    expect(names).toContain("Claude");
    // Claude resolves to the referral link (revenue intact).
    expect(links.find((l) => l.value === "Claude")?.href).toContain("claude.ai/referral/");
  });

  it("does not misfire on common words that collide with tool names", () => {
    const out = build(["Make sure to close the loop before you build."]);
    expect(linkHrefs(out.instructions[0])).toHaveLength(0);
  });

  it("is case-sensitive for registry auto-links (brand capitalization only)", () => {
    const out = build(["I had no notion of the plan."]);
    expect(linkHrefs(out.instructions[0])).toHaveLength(0);
  });

  it("still links an off-registry recommended tool via its homepage", () => {
    const out = build(
      ["Store leads in Airtable as your CRM layer."],
      [ref({ name: "Airtable", homepageUrl: "https://airtable.com" })],
    );
    const links = linkHrefs(out.instructions[0]);
    expect(links.find((l) => l.value === "Airtable")?.href).toBe("https://airtable.com");
  });

  it("keeps personal tasks link-free (ad-free experience)", () => {
    const out = build(["Use Zapier and paste into Claude to plan your trip."], [], false);
    expect(linkHrefs(out.instructions[0])).toHaveLength(0);
  });

  it("keeps the recommended-tools chips limited to the model's picks", () => {
    const out = build(["Use Zapier and Notion."], [ref({ name: "Instantly", registrySlug: "instantly" })]);
    expect(out.toolLinks.map((t) => t.name)).toEqual(["Instantly"]);
  });
});
