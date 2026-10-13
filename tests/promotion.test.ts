import { describe, it, expect } from "vitest";
import { slugify, normalizeForDedup } from "@/lib/feed/slug";
import { scoreQuality, qualifiesForPromotion, PROMOTE_MIN_SCORE } from "@/lib/feed/quality";

describe("slugify", () => {
  it("lowercases, hyphenates, strips punctuation", () => {
    expect(slugify("5-Day McKinney, Texas Itinerary!")).toBe("5-day-mckinney-texas-itinerary");
  });
  it("strips accents to ascii", () => {
    expect(slugify("Café résumé plan")).toBe("cafe-resume-plan");
  });
  it("trims leading/trailing hyphens and collapses runs", () => {
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
  });
  it("caps length and never ends in a hyphen", () => {
    const s = slugify("a ".repeat(100));
    expect(s.length).toBeLessThanOrEqual(70);
    expect(s.endsWith("-")).toBe(false);
  });
  it("falls back to 'prompt' for empty/symbol-only input", () => {
    expect(slugify("!!!")).toBe("prompt");
    expect(slugify("")).toBe("prompt");
  });
});

describe("normalizeForDedup", () => {
  it("collapses case and punctuation so near-identical titles match", () => {
    expect(normalizeForDedup("Best Man Speech: Funny & Heartfelt")).toBe(
      normalizeForDedup("best man speech funny heartfelt"),
    );
  });
  it("distinguishes genuinely different titles", () => {
    expect(normalizeForDedup("Italy trip planner")).not.toBe(
      normalizeForDedup("Spain trip planner"),
    );
  });
});

describe("scoreQuality", () => {
  it("rewards a substantive prompt with steps", () => {
    const score = scoreQuality({
      title: "Cold Outreach Email Sequence for SaaS Demos",
      promptText: "x".repeat(450),
      instructionsCount: 5,
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });
  it("scores a thin prompt low", () => {
    expect(scoreQuality({ title: "hi", promptText: "short", instructionsCount: 0 })).toBeLessThan(
      PROMOTE_MIN_SCORE,
    );
  });
});

describe("qualifiesForPromotion", () => {
  it("promotes a real, substantive prompt", () => {
    expect(
      qualifiesForPromotion({
        title: "Weekly High-Protein Meal Prep Plan Under $75",
        promptText: "x".repeat(300),
        instructionsCount: 3,
      }),
    ).toBe(true);
  });
  it("rejects a near-empty prompt body regardless of title", () => {
    expect(
      qualifiesForPromotion({
        title: "A perfectly reasonable looking title here",
        promptText: "too short to be a real page",
        instructionsCount: 5,
      }),
    ).toBe(false);
  });
  it("rejects a junk title", () => {
    expect(
      qualifiesForPromotion({ title: "hey", promptText: "x".repeat(500), instructionsCount: 5 }),
    ).toBe(false);
  });
});
