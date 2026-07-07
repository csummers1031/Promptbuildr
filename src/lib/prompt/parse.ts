/**
 * Defensive JSON extraction from model text output. Structured outputs make
 * this rarely necessary, but per spec we keep the full fallback chain:
 * strip fences -> JSON.parse -> extract first balanced object -> fail.
 */

export function stripFences(text: string): string {
  let t = text.trim();
  // ```json ... ``` or ``` ... ```
  const fence = t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fence) t = fence[1].trim();
  return t;
}

/** Extract the first balanced top-level JSON object from arbitrary text. */
export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseModelJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const stripped = stripFences(text);
  try {
    return { ok: true, value: JSON.parse(stripped) };
  } catch {
    // fall through
  }
  const extracted = extractFirstJsonObject(stripped);
  if (extracted) {
    try {
      return { ok: true, value: JSON.parse(extracted) };
    } catch (e) {
      return { ok: false, error: `extracted object failed to parse: ${(e as Error).message}` };
    }
  }
  return { ok: false, error: "no parseable JSON object found in model output" };
}
