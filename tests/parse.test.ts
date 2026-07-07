import { describe, it, expect } from "vitest";
import { stripFences, extractFirstJsonObject, parseModelJson } from "@/lib/prompt/parse";

describe("stripFences", () => {
  it("strips ```json fences", () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it("strips bare ``` fences", () => {
    expect(stripFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it("leaves unfenced text alone", () => {
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("extractFirstJsonObject", () => {
  it("extracts a balanced object from surrounding prose", () => {
    expect(extractFirstJsonObject('here you go: {"a":{"b":1}} thanks')).toBe('{"a":{"b":1}}');
  });
  it("ignores braces inside strings", () => {
    expect(extractFirstJsonObject('{"a":"has } brace"}')).toBe('{"a":"has } brace"}');
  });
  it("handles escaped quotes inside strings", () => {
    expect(extractFirstJsonObject('{"a":"quote \\" and }"}')).toBe('{"a":"quote \\" and }"}');
  });
  it("returns null when no object present", () => {
    expect(extractFirstJsonObject("no json here")).toBeNull();
  });
});

describe("parseModelJson", () => {
  it("parses clean JSON", () => {
    const r = parseModelJson('{"a":1}');
    expect(r.ok && r.value).toEqual({ a: 1 });
  });
  it("parses fenced JSON", () => {
    const r = parseModelJson('```json\n{"a":1}\n```');
    expect(r.ok && r.value).toEqual({ a: 1 });
  });
  it("recovers JSON embedded in prose", () => {
    const r = parseModelJson('Sure! {"a":1} done');
    expect(r.ok && r.value).toEqual({ a: 1 });
  });
  it("fails on non-JSON", () => {
    const r = parseModelJson("nope");
    expect(r.ok).toBe(false);
  });
});
