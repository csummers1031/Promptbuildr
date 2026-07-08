import { countGenerationsByIp, countGenerationsByUser } from "@/db/repo";
import { getSpendState, type SpendState } from "@/lib/spend";

/**
 * Rate limiting + spend gating for /api/generate.
 *
 * Anonymous: 1 lifetime generation (signed cookie is the primary gate; the
 *   IP-history check is the DB-backed backstop). Friction, not security.
 * Registered: 15/day per account AND 30/day per IP (scraper backstop),
 *   dropped to 3/day per account when spend hits the cap.
 * Global: hard-stop at 120% of the monthly cap for everyone.
 *
 * Without DATABASE_URL, DB-backed counts return 0 — only the cookie gate
 * applies, which is fine for local/preview.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const LIMITS = {
  accountPerDay: 15,
  accountPerDayCapped: 3,
  ipPerDay: 30,
};

export interface RateDecision {
  allowed: boolean;
  reason?: "anon-used" | "account-daily" | "ip-daily" | "spend-cap" | "spend-hardstop";
  /** true when the anonymous free generation is being consumed */
  requiresEmailNext?: boolean;
  spend: SpendState;
}

export interface RateContext {
  now: Date;
  ipHash: string;
  /** true if the signed anon cookie shows a prior free generation */
  anonAlreadyUsed: boolean;
  /** present when a valid session cookie is set */
  userId: string | null;
}

export async function checkRateLimit(ctx: RateContext): Promise<RateDecision> {
  const spend = await getSpendState(ctx.now);
  const since = new Date(ctx.now.getTime() - DAY_MS);

  // Global hard stop for everyone at 120%
  if (spend.level === "hardstop") {
    return { allowed: false, reason: "spend-hardstop", spend };
  }

  if (!ctx.userId) {
    // Anonymous: at the cap, anonymous generations are paused entirely.
    if (spend.level === "cap") {
      return { allowed: false, reason: "spend-cap", requiresEmailNext: true, spend };
    }
    if (ctx.anonAlreadyUsed) {
      return { allowed: false, reason: "anon-used", requiresEmailNext: true, spend };
    }
    // DB backstop: this IP already generated before (cookie may be cleared).
    const ipCount = await countGenerationsByIp(ctx.ipHash, since);
    if (ipCount >= 1) {
      return { allowed: false, reason: "anon-used", requiresEmailNext: true, spend };
    }
    return { allowed: true, requiresEmailNext: true, spend };
  }

  // Registered user
  const perDayCap = spend.level === "cap" ? LIMITS.accountPerDayCapped : LIMITS.accountPerDay;
  const [userCount, ipCount] = await Promise.all([
    countGenerationsByUser(ctx.userId, since),
    countGenerationsByIp(ctx.ipHash, since),
  ]);
  if (userCount >= perDayCap) return { allowed: false, reason: "account-daily", spend };
  if (ipCount >= LIMITS.ipPerDay) return { allowed: false, reason: "ip-daily", spend };
  return { allowed: true, spend };
}

export function rateMessage(reason: RateDecision["reason"]): string {
  switch (reason) {
    case "anon-used":
      return "You've used your free prompt. Add your email to keep generating — it's still free.";
    case "account-daily":
      return "You've hit today's generation limit. Come back tomorrow!";
    case "ip-daily":
      return "Too many generations from this network today. Please try again later.";
    case "spend-cap":
      return "We're at capacity for the month. Drop your email and we'll let you know when it reopens.";
    case "spend-hardstop":
      return "We've hit capacity for the month. Drop your email and we'll notify you when we're back.";
    default:
      return "Please try again later.";
  }
}
