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
}

/** Minimum score (0–100) a prompt must reach to earn a page. */
export const PROMOTE_MIN_SCORE = 50;

/** Hard floor: never index a prompt whose body is this short. */
export const MIN_PROMPT_CHARS = 120;

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

/** Does this prompt qualify for a public, indexable page? */
export function qualifiesForPromotion(s: QualitySignals): boolean {
  if (s.title.trim().length < 6) return false;
  if (s.promptText.trim().length < MIN_PROMPT_CHARS) return false;
  return scoreQuality(s) >= PROMOTE_MIN_SCORE;
}
