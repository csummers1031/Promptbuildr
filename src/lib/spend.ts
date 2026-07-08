import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { monthlySpend } from "@/db/schema";

/**
 * Monthly API-spend circuit breaker (approved requirement 5).
 * Thresholds against MONTHLY_SPEND_CAP (default $50):
 *   80%  -> warn (surfaced in the weekly digest)
 *  100%  -> pause anonymous generations; registered users capped at 3/day;
 *           autonomy seed job paused
 *  120%  -> hard stop: pause ALL generations
 *
 * Without DATABASE_URL we cannot track spend, so the breaker is disabled
 * (state "ok") — acceptable for local/preview; production always sets the URL.
 */

export type SpendLevel = "ok" | "warn" | "cap" | "hardstop";

export interface SpendState {
  level: SpendLevel;
  month: string;
  spentUsd: number;
  capUsd: number;
  ratio: number;
}

export function currentMonthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function capUsd(): number {
  const raw = Number(process.env.MONTHLY_SPEND_CAP);
  return Number.isFinite(raw) && raw > 0 ? raw : 50;
}

function levelFor(ratio: number): SpendLevel {
  if (ratio >= 1.2) return "hardstop";
  if (ratio >= 1.0) return "cap";
  if (ratio >= 0.8) return "warn";
  return "ok";
}

/** Read the current month's spend state. Pass `now` (edge-safe, no Date.now in libs). */
export async function getSpendState(now: Date): Promise<SpendState> {
  const cap = capUsd();
  const month = currentMonthKey(now);
  const db = getDb();
  if (!db) {
    return { level: "ok", month, spentUsd: 0, capUsd: cap, ratio: 0 };
  }
  const rows = await db
    .select({ costMicros: monthlySpend.costMicros })
    .from(monthlySpend)
    .where(sql`${monthlySpend.month} = ${month}`);
  const spentUsd = rows.length ? rows[0].costMicros / 1_000_000 : 0;
  const ratio = cap > 0 ? spentUsd / cap : 0;
  return { level: levelFor(ratio), month, spentUsd, capUsd: cap, ratio };
}

/** Accumulate spend after a generation (idempotent upsert on month). */
export async function recordSpend(now: Date, costUsd: number, generations = 1): Promise<void> {
  const db = getDb();
  if (!db) return;
  const month = currentMonthKey(now);
  const micros = Math.round(costUsd * 1_000_000);
  await db
    .insert(monthlySpend)
    .values({ month, costMicros: micros, generations })
    .onConflictDoUpdate({
      target: monthlySpend.month,
      set: {
        costMicros: sql`${monthlySpend.costMicros} + ${micros}`,
        generations: sql`${monthlySpend.generations} + ${generations}`,
        updatedAt: sql`now()`,
      },
    });
}
