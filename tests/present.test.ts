import { describe, it, expect } from "vitest";
import { stripLeadingEnumerator } from "@/lib/present";

describe("stripLeadingEnumerator", () => {
  it("strips '1. '", () => {
    expect(stripLeadingEnumerator("1. Open ChatGPT")).toBe("Open ChatGPT");
  });
  it("strips '2) '", () => {
    expect(stripLeadingEnumerator("2) Fill in placeholders")).toBe("Fill in placeholders");
  });
  it("strips 'Step 3: '", () => {
    expect(stripLeadingEnumerator("Step 3: Configure the API")).toBe("Configure the API");
  });
  it("strips '4 - '", () => {
    expect(stripLeadingEnumerator("4 - Wire up routing")).toBe("Wire up routing");
  });
  it("leaves an unnumbered step alone", () => {
    expect(stripLeadingEnumerator("Open ChatGPT and log in")).toBe("Open ChatGPT and log in");
  });
  it("does not strip numbers mid-sentence", () => {
    expect(stripLeadingEnumerator("Set temperature to 0.5 for consistency")).toBe(
      "Set temperature to 0.5 for consistency",
    );
  });
});
