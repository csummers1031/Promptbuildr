import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkRateLimit, rateMessage } from "@/lib/rateLimit";

// These run in no-DB mode: DB-backed counts return 0, so only the cookie
// gate and spend level (also 0 without DB) apply.
const origDb = process.env.DATABASE_URL;
beforeEach(() => delete process.env.DATABASE_URL);
afterEach(() => {
  if (origDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = origDb;
});

const now = new Date("2026-07-08T12:00:00Z");

describe("checkRateLimit — anonymous", () => {
  it("allows a first anonymous generation", async () => {
    const d = await checkRateLimit({ now, ipHash: "ip1", anonAlreadyUsed: false, userId: null });
    expect(d.allowed).toBe(true);
    expect(d.requiresEmailNext).toBe(true);
  });
  it("blocks a second anonymous generation (cookie shows prior use)", async () => {
    const d = await checkRateLimit({ now, ipHash: "ip1", anonAlreadyUsed: true, userId: null });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("anon-used");
    expect(d.requiresEmailNext).toBe(true);
  });
});

describe("checkRateLimit — registered", () => {
  it("allows a registered user (no DB counts to trip)", async () => {
    const d = await checkRateLimit({ now, ipHash: "ip1", anonAlreadyUsed: true, userId: "u1" });
    expect(d.allowed).toBe(true);
  });
});

describe("rateMessage", () => {
  it("nudges toward email on anon-used", () => {
    expect(rateMessage("anon-used")).toMatch(/email/i);
  });
  it("has a message for the hard stop", () => {
    expect(rateMessage("spend-hardstop")).toMatch(/capacity/i);
  });
});
