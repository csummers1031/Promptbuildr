/**
 * Quality gate for promotion.
 *
 * Only prompts that clear a real value bar become indexable pages. This keeps
 * the public, crawlable surface free of thin/empty pages (Google's "scaled
 * content abuse" targets mass-produced low-value pages — gating UGC is the
 * stated safe harbour). Pure + deterministic so it's unit-testable.
 */

export interface QualitySignals {
  title: string;
  promptText: string;
  /** number of usage/how-to steps attached to the prompt */
  instructionsCount: number;
  /** the user's raw task text — used to spot vanity/branded one-offs */
  taskInput?: string;
}

/** Minimum score (0–100) a prompt must reach to earn a page. */
export const PROMOTE_MIN_SCORE = 50;

/** Hard floor: never index a prompt whose body is this short. */
export const MIN_PROMPT_CHARS = 120;

// Placeholder-style domains that are fine (they're examples, not a real brand).
const PLACEHOLDER_DOMAIN =
  /\b(example|yourcompany|yoursite|yourbrand|company|domain|email|test|acme|mysite|yourdomain)\.(com|org|net|io|ai|co|app)\b/gi;

/**
 * Does the user's own wording name a specific real brand, site, person, or
 * contact? A real domain/URL/email/@handle in the title or task means this is a
 * vanity or private one-off ("blog writer for acme.com", "email to jane@x.com"),
 * not a reusable template. Such prompts still get a shareable page, but must NOT
 * be indexed — they are thin, self-referential, and can leak private details.
 * Bracketed [PLACEHOLDERS] and example.com-style domains are ignored.
 */
export function looksVanityOrPrivate(title: string, taskInput = ""): boolean {
  const text = `${title}\n${taskInput}`
    .replace(/\[[^\]]*\]/g, " ") // drop [PLACEHOLDER] tokens
    .replace(PLACEHOLDER_DOMAIN, " "); // drop example.com-style domains
  const hasUrl = /\bhttps?:\/\/\S+/i.test(text);
  const hasDomain =
    /\b[a-z0-9][a-z0-9-]*\.(com|io|net|org|ai|co|app|dev|xyz|shop|store|biz|me|us)\b/i.test(text);
  const hasEmail = /\b[\w.+-]+@[\w-]+\.\w{2,}\b/.test(text);
  const hasHandle = /(^|\s)@[a-z0-9_]{2,}\b/i.test(text);
  return hasUrl || hasDomain || hasEmail || hasHandle;
}

/** Score a prompt's page-worthiness from 0–100. */
export function scoreQuality(s: QualitySignals): number {
  const title = s.title.trim();
  const promptLen = s.promptText.trim().length;
  const titleWords = title.split(/\s+/).filter(Boolean).length;

  let score = 0;

  // Title (0–25): sane length + a few words reads like a real page title.
  if (title.length >= 10 && title.length <= 90) score += 15;
  else if (title.length >= 6) score += 8;
  if (titleWords >= 3) score += 10;
  else if (titleWords >= 2) score += 5;

  // Prompt body (0–45): the core asset must be substantive.
  if (promptLen >= 400) score += 45;
  else if (promptLen >= 250) score += 35;
  else if (promptLen >= 150) score += 22;
  else if (promptLen >= 80) score += 10;

  // Usage instructions (0–30): steps make the page richer than a bare string.
  if (s.instructionsCount >= 4) score += 30;
  else if (s.instructionsCount >= 2) score += 20;
  else if (s.instructionsCount >= 1) score += 10;

  return Math.min(100, score);
}

/** Does this prompt qualify for a public, INDEXABLE page? (It still gets a
 *  shareable page regardless — this only gates sitemap/feed/robots indexing.) */
export function qualifiesForPromotion(s: QualitySignals): boolean {
  if (s.title.trim().length < 6) return false;
  if (s.promptText.trim().length < MIN_PROMPT_CHARS) return false;
  if (looksVanityOrPrivate(s.title, s.taskInput)) return false;
  return scoreQuality(s) >= PROMOTE_MIN_SCORE;
}
