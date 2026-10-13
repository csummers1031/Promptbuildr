/**
 * Slug + dedup helpers for the promotion pipeline.
 *
 * A promoted prompt gets a stable, human-readable URL slug derived from its
 * title. `normalizeForDedup` produces a loose signature used to detect when a
 * new prompt is effectively the same as one that already has a page (so we
 * don't publish near-duplicate thin pages — a Google "scaled content" risk).
 */

const MAX_SLUG_LEN = 70;

/** Title -> URL slug: ascii, lowercase, hyphenated, length-capped. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LEN)
    .replace(/-+$/g, "");
  return base || "prompt";
}

/** Loose content signature for duplicate detection (alphanumerics only). */
export function normalizeForDedup(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
