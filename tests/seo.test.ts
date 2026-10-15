import { describe, it, expect } from "vitest";
import {
  orgJsonLd,
  webSiteJsonLd,
  creativeWorkJsonLd,
  collectionPageJsonLd,
  promptFaqs,
  faqJsonLd,
  safeJsonLd,
} from "@/lib/seo";

describe("safeJsonLd", () => {
  it("escapes characters that could break out of a <script> tag", () => {
    const out = safeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).toContain("\\u003c");
    expect(out).toContain("\\u003e");
  });
  it("escapes JS line separators U+2028 / U+2029 and ampersand", () => {
    const out = safeJsonLd({ t: "a b c&d" });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(out).toContain("\\u0026");
  });
  it("round-trips back to the original data once unescaped", () => {
    const data = { title: "Build a <b>bold</b> prompt & ship it" };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });
});

describe("orgJsonLd", () => {
  it("has a logo and a de-duplicated sameAs", () => {
    const o = orgJsonLd() as Record<string, unknown>;
    expect(o["@type"]).toBe("Organization");
    expect(typeof o.logo).toBe("string");
    const sameAs = o.sameAs as string[];
    expect(new Set(sameAs).size).toBe(sameAs.length); // no duplicates
  });
});

describe("webSiteJsonLd", () => {
  it("drops the retired SearchAction", () => {
    const w = webSiteJsonLd() as Record<string, unknown>;
    expect(w["@type"]).toBe("WebSite");
    expect(w.potentialAction).toBeUndefined();
  });
});

describe("creativeWorkJsonLd", () => {
  it("marks up the prompt text and core fields", () => {
    const c = creativeWorkJsonLd({
      title: "Cold Outreach Emails",
      promptText: "You are an expert SDR. Write...",
      abstract: "A prompt that drafts cold outreach.",
      url: "https://promptbuildr.ai/prompts/cold-outreach-emails",
      datePublished: "2026-10-13T00:00:00.000Z",
      dateModified: "2026-10-13T00:00:00.000Z",
      keywords: ["Sales/SDR", "ChatGPT", "Email outreach"],
      aiTool: "ChatGPT",
    }) as Record<string, unknown>;
    expect(c["@type"]).toBe("CreativeWork");
    expect(c.text).toContain("expert SDR");
    expect(c.keywords).toBe("Sales/SDR, ChatGPT, Email outreach");
    expect(c.isAccessibleForFree).toBe(true);
  });
});

describe("collectionPageJsonLd", () => {
  it("enumerates each item URL in positioned ListItems", () => {
    const c = collectionPageJsonLd({
      name: "Feed",
      description: "desc",
      url: "https://promptbuildr.ai/prompts",
      items: [
        { url: "https://promptbuildr.ai/prompts/a", name: "A" },
        { url: "https://promptbuildr.ai/prompts/b", name: "B" },
      ],
    }) as Record<string, unknown>;
    const list = c.mainEntity as Record<string, unknown>;
    expect(list["@type"]).toBe("ItemList");
    expect(list.numberOfItems).toBe(2);
    const els = list.itemListElement as Record<string, unknown>[];
    expect(els[0].position).toBe(1);
    expect(els[1].url).toBe("https://promptbuildr.ai/prompts/b");
  });
  it("is valid with an empty item list", () => {
    const c = collectionPageJsonLd({ name: "x", description: "y", url: "z", items: [] }) as Record<
      string,
      unknown
    >;
    const list = c.mainEntity as Record<string, unknown>;
    expect(list.numberOfItems).toBe(0);
    expect(list.itemListElement).toEqual([]);
  });
});

describe("promptFaqs", () => {
  it("produces 3 genuine, page-specific Q&As wrappable as FAQPage", () => {
    const faqs = promptFaqs({
      title: "Italy Trip Planner",
      aiTool: "ChatGPT",
      role: "Personal Use",
      outputType: "Strategy/Plan",
    });
    expect(faqs).toHaveLength(3);
    const fp = faqJsonLd(faqs) as Record<string, unknown>;
    expect(fp["@type"]).toBe("FAQPage");
    expect((fp.mainEntity as unknown[]).length).toBe(3);
  });
});
