import { describe, it, expect } from "vitest";
import { pickLoadingOffers } from "@/lib/offers";

describe("pickLoadingOffers", () => {
  it("returns relevant offers for a business output type", () => {
    const offers = pickLoadingOffers("Sales/SDR", "Email/Outreach");
    expect(offers.length).toBe(3);
    // All resolve to real tool links with attribution.
    for (const o of offers) {
      expect(o.href).toMatch(/^https:\/\//);
      expect(o.href).toContain("utm_campaign=builder-loading");
      expect(o.name.length).toBeGreaterThan(0);
    }
  });

  it("stays ad-free for personal output types regardless of role", () => {
    expect(pickLoadingOffers("Marketer", "Writing/Personal")).toEqual([]);
    expect(pickLoadingOffers("Founder/CEO", "Learning/How-To")).toEqual([]);
    expect(pickLoadingOffers("Personal Use", "Writing/Personal")).toEqual([]);
  });

  it("uses top offers for an unknown output only when the role is business", () => {
    expect(pickLoadingOffers("Founder/CEO", "Other").length).toBe(3);
    expect(pickLoadingOffers("Personal Use", "Other")).toEqual([]);
    expect(pickLoadingOffers("Student", "Other")).toEqual([]);
  });

  it("matches the offer to the output category", () => {
    const code = pickLoadingOffers("Product Manager", "Code/Automation").map((o) => o.name.toLowerCase());
    expect(code.join(" ")).toMatch(/n8n|make|zapier/);
  });
});
