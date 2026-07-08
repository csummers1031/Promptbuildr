/**
 * Visitor identity + signed session cookies. Uses Web Crypto (HMAC-SHA-256)
 * so it runs on both Node and Cloudflare Workers. Only hashes are stored —
 * never raw IPs — keeping the privacy story honest.
 */

const enc = new TextEncoder();

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.CRON_SECRET || "dev-insecure-secret-change-me";
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufToHex(sig);
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Salted hash of an IP for storage/rate-limiting (raw IP never persisted). */
export async function hashIp(ip: string): Promise<string> {
  return (await hmac(`ip:${ip}`)).slice(0, 32);
}

/** Combined visitor hash (anonymous cookie id + ip) for 1-per-visitor logic. */
export async function visitorHash(anonId: string, ip: string): Promise<string> {
  return (await hmac(`visitor:${anonId}:${ip}`)).slice(0, 32);
}

export function extractIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

// --- Signed cookie payloads (session + anonymous id) ---

interface Signed<T> {
  data: T;
  sig: string;
}

export async function signValue<T>(data: T): Promise<string> {
  const json = JSON.stringify(data);
  const sig = await hmac(json);
  const payload: Signed<T> = { data, sig };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export async function verifyValue<T>(cookie: string | undefined): Promise<T | null> {
  if (!cookie) return null;
  try {
    const payload: Signed<T> = JSON.parse(decodeURIComponent(escape(atob(cookie))));
    const expected = await hmac(JSON.stringify(payload.data));
    if (expected !== payload.sig) return null;
    return payload.data;
  } catch {
    return null;
  }
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
}

export interface AnonData {
  id: string;
  createdAt: number;
}

export function randomId(): string {
  return crypto.randomUUID();
}

export const COOKIE_ANON = "pb_anon";
export const COOKIE_SESSION = "pb_session";
