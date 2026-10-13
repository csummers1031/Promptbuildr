/**
 * Record a prompt view. Fires a beacon to /api/view, deduped per browser
 * session so refreshing/re-expanding the same prompt doesn't inflate counts.
 * Returns true if it actually fired (so callers can optimistically bump the UI).
 * Client-only; fully fail-safe.
 */
export function recordView(promptId: string): boolean {
  try {
    const key = "pv:" + promptId;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode / no storage — still count once this call */
  }
  try {
    const body = JSON.stringify({ promptId });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/view", blob)) return true;
    void fetch("/api/view", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  } catch {
    /* ignore */
  }
  return true;
}
