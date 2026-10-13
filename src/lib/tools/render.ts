import { resolveToolLink, type ResolvedToolLink, type ToolRef } from "@/lib/tools/resolve";

export interface RenderedTools {
  links: ResolvedToolLink[];
  /** Primary campaign tag for UTMs (first category tag, or a fallback). */
  campaign: string;
}

export function renderTools(refs: ToolRef[], categoryTags: string[]): RenderedTools {
  const campaign = (categoryTags[0] ?? "general").toLowerCase();
  const links = refs.map((r) => resolveToolLink(r, campaign));
  return { links, campaign };
}

export type InstructionSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split an instruction string into text/link segments by matching resolved
 * tool names on word boundaries. Only tools with an href are linked, first
 * occurrence each, longest name first so "HubSpot CRM" beats "HubSpot".
 * Matching is case-insensitive by default; names in `opts.caseSensitiveNames`
 * must match the exact brand capitalization (used for registry tools whose
 * names collide with common words, e.g. "Notion").
 */
export function linkifyInstruction(
  text: string,
  links: ResolvedToolLink[],
  opts?: { caseSensitiveNames?: ReadonlySet<string> },
): InstructionSegment[] {
  const linkable = links.filter((l) => l.href);
  if (linkable.length === 0) return [{ type: "text", value: text }];

  const sorted = [...linkable].sort((a, b) => b.name.length - a.name.length);

  interface Match {
    start: number;
    end: number;
    href: string;
  }
  const matches: Match[] = [];
  for (const link of sorted) {
    const caseSensitive = opts?.caseSensitiveNames?.has(link.name) ?? false;
    const re = new RegExp(`\\b${escapeRegExp(link.name)}\\b`, caseSensitive ? "" : "i");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index;
    const end = start + m[0].length;
    if (matches.some((x) => start < x.end && end > x.start)) continue; // no overlap
    matches.push({ start, end, href: link.href! });
  }
  matches.sort((a, b) => a.start - b.start);

  const segments: InstructionSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) segments.push({ type: "text", value: text.slice(cursor, m.start) });
    segments.push({ type: "link", value: text.slice(m.start, m.end), href: m.href });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) });
  return segments.length ? segments : [{ type: "text", value: text }];
}
