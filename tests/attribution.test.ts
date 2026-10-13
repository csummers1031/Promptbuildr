import { describe, it, expect } from "vitest";
import { classifyTraffic, hostFromUrl } from "@/lib/attribution";

const SELF = "promptbuildr.ai";

describe("classifyTraffic", () => {
  it("direct when no referrer and no utm", () => {
    expect(classifyTraffic({ selfHost: SELF })).toMatchObject({ channel: "direct", aiSource: null });
  });

  it("organic for search engine referrers", () => {
    for (const r of ["https://www.google.com/", "https://www.bing.com/search?q=x", "https://duckduckgo.com/"]) {
      expect(classifyTraffic({ referrer: r, selfHost: SELF }).channel).toBe("organic");
    }
  });

  it("detects AI assistants by referrer host", () => {
    expect(classifyTraffic({ referrer: "https://chatgpt.com/", selfHost: SELF })).toMatchObject({ channel: "ai", aiSource: "chatgpt" });
    expect(classifyTraffic({ referrer: "https://www.perplexity.ai/search", selfHost: SELF })).toMatchObject({ channel: "ai", aiSource: "perplexity" });
    expect(classifyTraffic({ referrer: "https://gemini.google.com/", selfHost: SELF })).toMatchObject({ channel: "ai", aiSource: "gemini" });
    expect(classifyTraffic({ referrer: "https://claude.ai/", selfHost: SELF })).toMatchObject({ channel: "ai", aiSource: "claude" });
  });

  it("detects AI via utm_source even without a referrer", () => {
    expect(classifyTraffic({ utmSource: "chatgpt", selfHost: SELF })).toMatchObject({ channel: "ai", aiSource: "chatgpt" });
  });

  it("classifies social referrers", () => {
    for (const r of ["https://t.co/abc", "https://www.linkedin.com/feed", "https://x.com/i", "https://www.reddit.com/r/x"]) {
      expect(classifyTraffic({ referrer: r, selfHost: SELF }).channel).toBe("social");
    }
  });

  it("marks self-referrals as internal", () => {
    expect(classifyTraffic({ referrer: "https://promptbuildr.ai/prompts", selfHost: SELF }).channel).toBe("internal");
    expect(classifyTraffic({ referrer: "https://www.promptbuildr.ai/", selfHost: SELF }).channel).toBe("internal");
  });

  it("falls back to referral for unknown referrers or any utm", () => {
    expect(classifyTraffic({ referrer: "https://someblog.com/post", selfHost: SELF }).channel).toBe("referral");
    expect(classifyTraffic({ utmSource: "newsletter", utmMedium: "email", selfHost: SELF }).channel).toBe("referral");
  });

  it("hostFromUrl strips www and handles junk", () => {
    expect(hostFromUrl("https://www.Example.com/x")).toBe("example.com");
    expect(hostFromUrl("not a url")).toBeNull();
    expect(hostFromUrl(null)).toBeNull();
  });
});
