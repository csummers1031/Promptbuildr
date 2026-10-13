import { describe, it, expect } from "vitest";
import { pickLoadingOffers } from "@/lib/offers";
import { OUTPUT_TYPES } from "@/config/constants";
import { getToolBySlug } from "@/config/tools";

// Tools on plain vendor homepages — no affiliate program, so they must never
// occupy a revenue slot on the loading screen.
const NON_EARNING = [
  "pipedrive", "attio", "clay", "vercel", "cloudflare", "zapier", "notion",
  "google-analytics-4", "posthog", "ahrefs", "semrush", "canva", "cloudways", "figma",
];
const nonEarningUrls = new Set(NON_EARNING.map((s) => getToolBySlug(s)!.url));

describe("pickLoadingOffers", () => {
  it("returns relevant offers for a business output type", () => {
    const offers = pickLoadingOffers("Sales/SDR", "Email/Outreach");
    expect(offers.length).toBe(3);
    // All resolve to real tool links (partner tracking links pass through as-is).
    for (const o of offers) {
      expect(o.href).toMatch(/^https:\/\//);
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

  it("never surfaces a non-earning (plain homepage) tool in any slot", () => {
    for (const ot of OUTPUT_TYPES) {
      for (const o of pickLoadingOffers("Founder/CEO", ot)) {
        expect(nonEarningUrls.has(o.href), `${ot}: ${o.name}`).toBe(false);
      }
    }
  });

  it("matches the offer to the output category", () => {
    const code = pickLoadingOffers("Product Manager", "Code/Automation").map((o) => o.name.toLowerCase());
    expect(code.join(" ")).toMatch(/n8n|make|zapier/);
  });
});
