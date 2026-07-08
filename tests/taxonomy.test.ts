import { describe, it, expect } from "vitest";
import {
  taxonomySlug,
  roleFromSlug,
  toolFromSlug,
  typeFromSlug,
  taxonomyIntro,
  taxonomyFaqs,
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
  it("produces unique intro per kind", () => {
    expect(taxonomyIntro("for", "Marketer").h1).toBe("AI prompts for Marketer");
    expect(taxonomyIntro("tool", "Claude").h1).toBe("Claude prompts");
    expect(taxonomyIntro("type", "Email/Outreach").h1).toBe("Email/Outreach prompts");
  });
  it("produces 3 FAQs", () => {
    expect(taxonomyFaqs("for", "Marketer")).toHaveLength(3);
    expect(taxonomyFaqs("tool", "Claude")).toHaveLength(3);
  });
});
