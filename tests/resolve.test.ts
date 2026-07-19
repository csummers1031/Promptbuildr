import { describe, it, expect } from "vitest";
import {
  validateHomepageUrl,
  validateRecommendations,
  resolveToolLink,
  offRegistryRefs,
} from "@/lib/tools/resolve";
import { TOOLS, normalizeToolName } from "@/config/tools";

describe("validateHomepageUrl", () => {
  it("accepts a clean https root", () => {
    expect(validateHomepageUrl("https://loom.com")).toBe("https://loom.com");
  });
  it("accepts one shallow path segment", () => {
    expect(validateHomepageUrl("https://calendly.com/product")).toBe("https://calendly.com/product");
  });
  it("rejects http", () => {
    expect(validateHomepageUrl("http://loom.com")).toBeNull();
  });
  it("rejects deep paths", () => {
    expect(validateHomepageUrl("https://x.com/a/b/c")).toBeNull();
  });
  it("rejects query strings (affiliate smuggling)", () => {
    expect(validateHomepageUrl("https://x.com?ref=spam")).toBeNull();
  });
  it("rejects url shorteners", () => {
    expect(validateHomepageUrl("https://bit.ly/xyz")).toBeNull();
  });
  it("rejects IP hosts and userinfo", () => {
    expect(validateHomepageUrl("https://1.2.3.4")).toBeNull();
    expect(validateHomepageUrl("https://user:pw@x.com")).toBeNull();
  });
  it("rejects junk", () => {
    expect(validateHomepageUrl("not a url")).toBeNull();
    expect(validateHomepageUrl(null)).toBeNull();
  });
});

describe("validateRecommendations", () => {
  it("resolves a valid registry slug", () => {
    // Read a real entry from the live registry so this survives tool churn.
    const sample = TOOLS[0];
    const refs = validateRecommendations([{ name: sample.name, registry_slug: sample.slug, homepage_url: null }]);
    expect(refs).toHaveLength(1);
    expect(refs[0].registrySlug).toBe(sample.slug);
  });
  it("matches a registry tool by name when slug is null", () => {
    const refs = validateRecommendations([{ name: "Zapier", registry_slug: null, homepage_url: "https://zapier.com" }]);
    expect(refs[0].registrySlug).toBe("zapier");
  });
  it("drops an invented slug but keeps as off-registry by name", () => {
    const refs = validateRecommendations([{ name: "Loom", registry_slug: "totally-fake-slug", homepage_url: "https://loom.com" }]);
    expect(refs[0].registrySlug).toBeNull();
    expect(refs[0].homepageUrl).toBe("https://loom.com");
  });
  it("caps off-registry tools at 2", () => {
    const refs = validateRecommendations([
      { name: "Loom", registry_slug: null, homepage_url: "https://loom.com" },
      { name: "Calendly", registry_slug: null, homepage_url: "https://calendly.com" },
      { name: "Typeform", registry_slug: null, homepage_url: "https://typeform.com" },
    ]);
    expect(offRegistryRefs(refs)).toHaveLength(2);
  });
  it("caps total tools at 3", () => {
    const refs = validateRecommendations([
      { name: "HubSpot", registry_slug: "hubspot", homepage_url: null },
      { name: "Zapier", registry_slug: "zapier", homepage_url: null },
      { name: "Notion", registry_slug: "notion", homepage_url: null },
      { name: "Canva", registry_slug: "canva", homepage_url: null },
    ]);
    expect(refs).toHaveLength(3);
  });
  it("dedupes by normalized name", () => {
    const refs = validateRecommendations([
      { name: "Apollo.io", registry_slug: "apollo-io", homepage_url: null },
      { name: "apolloio", registry_slug: null, homepage_url: null },
    ]);
    expect(refs).toHaveLength(1);
  });
  it("rejects names with smuggled markup or urls", () => {
    const refs = validateRecommendations([{ name: "Evil https://x.com", registry_slug: null, homepage_url: "https://x.com" }]);
    expect(refs).toHaveLength(0);
  });
  it("returns empty for non-array", () => {
    expect(validateRecommendations("nope")).toEqual([]);
  });
});

describe("resolveToolLink — auto-upgrade behavior", () => {
  it("registry ref gets a marketplace URL with UTMs", () => {
    const [ref] = validateRecommendations([{ name: "Instantly", registry_slug: "instantly", homepage_url: null }]);
    const link = resolveToolLink(ref, "cold-outbound");
    expect(link.source).toBe("registry");
    expect(link.href).toContain("hackingdemand.com/discount-marketplace/instantly");
    expect(link.href).toContain("utm_source=promptbuildr");
    expect(link.href).toContain("utm_campaign=cold-outbound");
  });
  it("off-registry ref links to homepage with no UTMs", () => {
    const [ref] = validateRecommendations([{ name: "Loom", registry_slug: null, homepage_url: "https://loom.com" }]);
    const link = resolveToolLink(ref, "content");
    expect(link.source).toBe("off-registry");
    expect(link.href).toBe("https://loom.com");
    expect(link.href).not.toContain("utm_");
  });
  it("off-registry ref with no valid URL renders as plain text", () => {
    const [ref] = validateRecommendations([{ name: "Obscuretool", registry_slug: null, homepage_url: "not-a-url" }]);
    const link = resolveToolLink(ref, "x");
    expect(link.source).toBe("none");
    expect(link.href).toBeNull();
  });
  it("an off-registry name later added to the registry auto-upgrades at render time", () => {
    // Simulate a stored off-registry ref whose normalized name now matches a
    // registry tool that routes through the HD marketplace. Pull that tool from
    // the live registry so the assertion isn't tied to a specific entry.
    const hdTool = TOOLS.find((t) => t.url.includes("discount-marketplace")) ?? TOOLS[0];
    const storedRef = {
      name: hdTool.name,
      normalized: normalizeToolName(hdTool.name),
      registrySlug: null,
      homepageUrl: "https://example.com",
    };
    const link = resolveToolLink(storedRef, "docs");
    expect(link.source).toBe("registry");
    expect(link.href).toContain(new URL(hdTool.url).pathname);
    expect(link.href).toContain("utm_");
  });
});
