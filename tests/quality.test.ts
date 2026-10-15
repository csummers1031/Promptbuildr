import { describe, it, expect } from "vitest";
import {
  looksVanityOrPrivate,
  qualifiesForPromotion,
  type QualitySignals,
} from "@/lib/feed/quality";

const good: QualitySignals = {
  title: "3-email cold outreach sequence for a SaaS demo",
  promptText:
    "You are an expert B2B sales copywriter. Write a 3-email cold outreach sequence that books a demo of [PRODUCT] for [TARGET_ROLE]. Keep each email under 90 words, lead with a specific pain point, and end with a soft CTA. Provide subject lines too.",
  instructionsCount: 4,
  taskInput: "Write cold outbound emails for a SaaS demo",
};

describe("looksVanityOrPrivate", () => {
  it("flags a real brand domain in the title/task (vanity one-off)", () => {
    expect(
      looksVanityOrPrivate(
        "Blog article writer for hackingdemand.com",
        "blog writer for hackingdemand.com",
      ),
    ).toBe(true);
  });
  it("flags a real email address", () => {
    expect(looksVanityOrPrivate("Reply to jane@acme-corp.com", "")).toBe(true);
  });
  it("flags a full URL and an @handle", () => {
    expect(looksVanityOrPrivate("Promote https://mystore.shop", "")).toBe(true);
    expect(looksVanityOrPrivate("Write a reply to @somebody", "")).toBe(true);
  });
  it("ignores bracketed placeholders and example-style domains", () => {
    expect(looksVanityOrPrivate("Cold email for [COMPANY.COM]", "pitch [PRODUCT]")).toBe(false);
    expect(looksVanityOrPrivate("Landing page for example.com", "")).toBe(false);
    expect(looksVanityOrPrivate("Email to jane@example.com", "")).toBe(false);
  });
  it("does not flag an ordinary reusable task", () => {
    expect(looksVanityOrPrivate(good.title, good.taskInput)).toBe(false);
  });
});

describe("qualifiesForPromotion", () => {
  it("promotes a substantive, generic prompt", () => {
    expect(qualifiesForPromotion(good)).toBe(true);
  });
  it("refuses a vanity/branded prompt even if it is substantive", () => {
    expect(
      qualifiesForPromotion({
        ...good,
        title: "Blog article writer for hackingdemand.com",
        taskInput: "blog writer for hackingdemand.com",
      }),
    ).toBe(false);
  });
  it("refuses a too-short prompt body", () => {
    expect(qualifiesForPromotion({ ...good, promptText: "short" })).toBe(false);
  });
});
