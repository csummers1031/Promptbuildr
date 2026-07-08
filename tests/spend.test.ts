import { describe, it, expect, afterEach } from "vitest";
import { currentMonthKey, capUsd, getSpendState } from "@/lib/spend";

const origCap = process.env.MONTHLY_SPEND_CAP;
const origDb = process.env.DATABASE_URL;
afterEach(() => {
  if (origCap === undefined) delete process.env.MONTHLY_SPEND_CAP;
  else process.env.MONTHLY_SPEND_CAP = origCap;
  if (origDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = origDb;
});

describe("currentMonthKey", () => {
  it("formats YYYY-MM in UTC", () => {
    expect(currentMonthKey(new Date("2026-07-08T23:00:00Z"))).toBe("2026-07");
    expect(currentMonthKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });
});

describe("capUsd", () => {
  it("defaults to 50", () => {
    delete process.env.MONTHLY_SPEND_CAP;
    expect(capUsd()).toBe(50);
  });
  it("reads a valid override", () => {
    process.env.MONTHLY_SPEND_CAP = "120";
    expect(capUsd()).toBe(120);
  });
  it("falls back on garbage", () => {
    process.env.MONTHLY_SPEND_CAP = "nope";
    expect(capUsd()).toBe(50);
  });
});

describe("getSpendState without DB", () => {
  it("returns ok/zero when DATABASE_URL is unset (breaker disabled)", async () => {
    delete process.env.DATABASE_URL;
    const s = await getSpendState(new Date("2026-07-08T00:00:00Z"));
    expect(s.level).toBe("ok");
    expect(s.spentUsd).toBe(0);
    expect(s.month).toBe("2026-07");
  });
});
