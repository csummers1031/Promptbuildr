import { describe, it, expect } from "vitest";
import {
  taxonomySlug,
  roleFromSlug,
  toolFromSlug,
  typeFromSlug,
  taxonomyIntro,
  taxonomyFaqs,
  pillLabel,
} from "@/lib/feed/taxonomy";

describe("taxonomySlug", () => {
  it("slugifies labels with slashes and spaces", () => {
    expect(taxonomySlug("Founder/CEO")).toBe("founder-ceo");
    expect(taxonomySlug("Sales/SDR")).toBe("sales-sdr");
    expect(taxonomySlug("Midjourney/Image AI")).toBe("midjourney-image-ai");
    expect(taxonomySlug("Email/Outreach")).toBe("email-outreach");
  });
});

describe("slug round-trips", () => {
  it("maps role slugs back to labels", () => {
    expect(roleFromSlug("founder-ceo")).toBe("Founder/CEO");
    expect(roleFromSlug("marketer")).toBe("Marketer");
    expect(roleFromSlug("nonsense")).toBeUndefined();
  });
  it("maps tool + type slugs back", () => {
    expect(toolFromSlug("chatgpt")).toBe("ChatGPT");
    expect(typeFromSlug("agent-workflow")).toBe("Agent/Workflow");
  });
});

describe("taxonomy copy", () => {
  it("produces unique, grammatical intro per kind", () => {
    expect(taxonomyIntro("for", "Marketer").h1).toBe("AI prompts for marketers");
    expect(taxonomyIntro("tool", "Claude").h1).toBe("Claude prompts");
    expect(taxonomyIntro("type", "Email/Outreach").h1).toBe("Prompts for outreach emails");
  });
  it("handles Other / slash labels without broken copy", () => {
    // No raw "Other", no "produce other", no bare slash label in the sentence.
    expect(taxonomyIntro("type", "Other").h1).toBe("Prompts for all kinds of tasks");
    expect(taxonomyIntro("for", "Founder/CEO").intro).toContain("founders and CEOs");
    expect(taxonomyIntro("tool", "Other/Any").h1).toBe("Prompts for any AI assistant");
    expect(taxonomyIntro("type", "Email/Outreach").intro).not.toContain("email/outreach");
  });
  it("produces 3 FAQs", () => {
    expect(taxonomyFaqs("for", "Marketer")).toHaveLength(3);
    expect(taxonomyFaqs("tool", "Claude")).toHaveLength(3);
  });
});

describe("pillLabel", () => {
  it("humanizes the Other catch-alls instead of showing bare 'Other'", () => {
    expect(pillLabel("for", "Other")).toBe("Any role");
    expect(pillLabel("type", "Other")).toBe("Any task");
    expect(pillLabel("tool", "Other/Any")).toBe("Any AI tool");
  });
  it("passes real labels through unchanged", () => {
    expect(pillLabel("for", "Marketer")).toBe("Marketer");
    expect(pillLabel("tool", "Claude")).toBe("Claude");
    expect(pillLabel("type", "Email/Outreach")).toBe("Email/Outreach");
  });
});
