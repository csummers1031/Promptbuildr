/**
 * Shared-secret auth for cron endpoints. The scheduler (GitHub Actions) sends
 * `Authorization: Bearer <CRON_SECRET>`; we compare in constant time. When
 * CRON_SECRET is unset, every request is rejected (fail closed).
 */

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const bearer = /^bearer /i.test(auth) ? auth.slice(7) : "";
  const header = req.headers.get("x-cron-secret") || "";
  return (bearer !== "" && safeEqual(bearer, secret)) || (header !== "" && safeEqual(header, secret));
}
