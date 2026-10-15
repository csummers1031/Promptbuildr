import { describe, it, expect } from "vitest";
import { aiToolLaunch } from "@/config/aiTools";

describe("aiToolLaunch", () => {
  it("opens Claude in a new chat, not the referral/signup link", () => {
    const l = aiToolLaunch("Claude");
    expect(l).not.toBeNull();
    expect(l!.mode).toBe("chat");
    expect(l!.href).toBe("https://claude.ai/new");
    expect(l!.href).not.toContain("referral");
  });

  it("links chat tools to their web app", () => {
    const l = aiToolLaunch("ChatGPT");
    expect(l).not.toBeNull();
    expect(l!.affiliate).toBe(false);
    expect(l!.mode).toBe("chat");
    expect(l!.href).toBe("https://chatgpt.com/");
  });

  it("flags editor assistants as editor mode", () => {
    expect(aiToolLaunch("Cursor")!.mode).toBe("editor");
    expect(aiToolLaunch("GitHub Copilot")!.mode).toBe("editor");
  });

  it("flags image tools as image mode", () => {
    expect(aiToolLaunch("Midjourney/Image AI")!.mode).toBe("image");
  });

  it("returns null for Other/Any (no single destination)", () => {
    expect(aiToolLaunch("Other/Any")).toBeNull();
  });

  it("only ever uses https destinations", () => {
    for (const tool of [
      "Claude",
      "ChatGPT",
      "Gemini",
      "Grok",
      "DeepSeek",
      "Muse",
      "Microsoft Copilot",
      "Perplexity",
      "GitHub Copilot",
      "Cursor",
      "Midjourney/Image AI",
    ]) {
      const l = aiToolLaunch(tool);
      expect(l, tool).not.toBeNull();
      expect(l!.href.startsWith("https://"), tool).toBe(true);
    }
  });
});
