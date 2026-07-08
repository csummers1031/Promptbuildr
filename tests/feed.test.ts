import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseSort, windowStart, compareForSort, type FeedPrompt } from "@/lib/feed/types";
import { getFeed, getPromptBySlug } from "@/db/feed";

const origDb = process.env.DATABASE_URL;
beforeEach(() => delete process.env.DATABASE_URL); // exercise the sample fallback
afterEach(() => {
  if (origDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = origDb;
});

const now = new Date("2026-07-08T12:00:00Z");

describe("parseSort", () => {
  it("accepts known sorts, defaults to week", () => {
    expect(parseSort("newest")).toBe("newest");
    expect(parseSort("today")).toBe("today");
    expect(parseSort("garbage")).toBe("week");
    expect(parseSort(undefined)).toBe("week");
  });
});

describe("windowStart", () => {
  it("today starts at UTC midnight", () => {
    expect(windowStart("today", now)!.toISOString()).toBe("2026-07-08T00:00:00.000Z");
  });
  it("all-time and newest have no lower bound", () => {
    expect(windowStart("all", now)).toBeNull();
    expect(windowStart("newest", now)).toBeNull();
  });
});

describe("compareForSort", () => {
  const a = { upvoteCount: 10, viewCount: 5, createdAt: "2026-07-01T00:00:00Z" } as FeedPrompt;
  const b = { upvoteCount: 10, viewCount: 9, createdAt: "2026-06-01T00:00:00Z" } as FeedPrompt;
  it("breaks upvote ties by views", () => {
    expect(compareForSort(a, b, "all")).toBeGreaterThan(0); // b (more views) first
  });
  it("newest sorts by recency", () => {
    expect(compareForSort(a, b, "newest")).toBeLessThan(0); // a (newer) first
  });
});

describe("getFeed (sample fallback)", () => {
  it("returns samples and respects role filter", async () => {
    const all = await getFeed({ sort: "all", limit: 50, offset: 0 }, now);
    expect(all.length).toBeGreaterThan(0);
    const sales = await getFeed({ sort: "all", role: "Sales/SDR", limit: 50, offset: 0 }, now);
    expect(sales.every((p) => p.role === "Sales/SDR")).toBe(true);
  });
  it("all-time sort ranks by upvotes", async () => {
    const top = await getFeed({ sort: "all", limit: 50, offset: 0 }, now);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].upvoteCount).toBeGreaterThanOrEqual(top[i].upvoteCount);
    }
  });
  it("newest sort ranks by recency", async () => {
    const newest = await getFeed({ sort: "newest", limit: 50, offset: 0 }, now);
    for (let i = 1; i < newest.length; i++) {
      expect(newest[i - 1].createdAt >= newest[i].createdAt).toBe(true);
    }
  });
});

describe("getPromptBySlug (sample fallback)", () => {
  it("finds a promoted sample by slug", async () => {
    const p = await getPromptBySlug("cold-email-saas-demo", now);
    expect(p?.slug).toBe("cold-email-saas-demo");
  });
  it("returns null for unknown slug", async () => {
    expect(await getPromptBySlug("does-not-exist", now)).toBeNull();
  });
});
