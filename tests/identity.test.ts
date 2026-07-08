import { describe, it, expect } from "vitest";
import { signValue, verifyValue, hashIp, extractIp } from "@/lib/identity";

describe("signed cookies", () => {
  it("round-trips a signed value", async () => {
    const signed = await signValue({ userId: "u1", email: "a@b.com", role: "Marketer" });
    const back = await verifyValue<{ userId: string }>(signed);
    expect(back?.userId).toBe("u1");
  });
  it("rejects a tampered payload", async () => {
    const signed = await signValue({ userId: "u1" });
    // flip a char in the base64
    const tampered = signed.slice(0, -2) + (signed.slice(-2) === "AA" ? "BB" : "AA");
    const back = await verifyValue(tampered);
    expect(back).toBeNull();
  });
  it("returns null for undefined/garbage", async () => {
    expect(await verifyValue(undefined)).toBeNull();
    expect(await verifyValue("not-base64!!!")).toBeNull();
  });
});

describe("hashIp", () => {
  it("is deterministic and does not leak the raw ip", async () => {
    const h1 = await hashIp("1.2.3.4");
    const h2 = await hashIp("1.2.3.4");
    expect(h1).toBe(h2);
    expect(h1).not.toContain("1.2.3.4");
    expect(h1).toHaveLength(32);
  });
  it("differs for different ips", async () => {
    expect(await hashIp("1.2.3.4")).not.toBe(await hashIp("5.6.7.8"));
  });
});

describe("extractIp", () => {
  it("prefers cf-connecting-ip", () => {
    const h = new Headers({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" });
    expect(extractIp(h)).toBe("9.9.9.9");
  });
  it("falls back to first x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(extractIp(h)).toBe("1.1.1.1");
  });
  it("defaults when nothing present", () => {
    expect(extractIp(new Headers())).toBe("0.0.0.0");
  });
});
