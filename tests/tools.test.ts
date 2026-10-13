import { describe, it, expect } from "vitest";
import {
  TOOLS,
  TOOL_CATEGORIES,
  getToolBySlug,
  buildMarketplaceUrl,
} from "@/config/tools";

describe("tool registry data", () => {
  it("every tool has a valid category and an https url", () => {
    for (const t of TOOLS) {
      expect(TOOL_CATEGORIES).toContain(t.category);
      expect(t.url).toMatch(/^https:\/\//);
      expect(t.slug.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
    }
  });

  it("has unique slugs", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes the newly added partner tools", () => {
    for (const slug of ["seamless-ai", "netlify", "runpod", "mindstudio", "databox", "omniseo", "elevenlabs", "gamma", "descript", "quillbot", "reclaim-ai"]) {
      expect(getToolBySlug(slug), slug).toBeDefined();
    }
  });
});

describe("buildMarketplaceUrl UTM rule", () => {
  it("appends UTMs to Hacking Demand marketplace links", () => {
    const hubspot = getToolBySlug("hubspot")!;
    const url = buildMarketplaceUrl(hubspot, "cold-outbound");
    expect(url).toContain("utm_source=promptbuildr");
    expect(url).toContain("utm_medium=referral");
    expect(url).toContain("utm_campaign=cold-outbound");
  });

  it("returns partner tracking links verbatim (no UTMs)", () => {
    for (const slug of ["instantly", "smartlead", "apollo-io", "n8n", "make", "railway"]) {
      const tool = getToolBySlug(slug)!;
      const url = buildMarketplaceUrl(tool, "builder-loading");
      expect(url, slug).toBe(tool.url);
      expect(url, slug).not.toContain("utm_source");
    }
  });

  it("leaves the Claude referral link intact", () => {
    const claude = getToolBySlug("claude")!;
    expect(buildMarketplaceUrl(claude, "writing")).toBe("https://claude.ai/referral/VBG0kPVoSQ?s=ios");
  });
});
