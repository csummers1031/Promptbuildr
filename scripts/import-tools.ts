/**
 * Import affiliate/marketplace tools into the registry.
 *
 * Usage:
 *   pnpm import-tools <file.csv|file.json> [--merge]
 *
 * Input formats:
 *   CSV  — header row: name,category,url[,description][,slug]
 *   JSON — array of { name, category, url, description?, slug? }
 *
 * Validation: every row needs a non-empty name, a known category, and a valid
 * https URL. Malformed rows are reported with their row number and the whole
 * import is rejected (nothing is written) unless every row passes.
 *
 * --merge keeps existing registry entries not present in the import
 * (matched by slug); default replaces the registry wholesale.
 */
import fs from "node:fs";
import path from "node:path";

const CATEGORIES = ["crm", "email-outreach", "hosting", "ai-tools", "analytics", "design"];
const DATA_PATH = path.join(process.cwd(), "src/config/tools.data.json");

interface ToolRow {
  slug: string;
  name: string;
  description: string;
  category: string;
  url: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return `not a valid URL: "${raw}"`;
  }
  if (url.protocol !== "https:") return `URL must be https: "${raw}"`;
  if (!url.hostname.includes(".")) return `URL hostname looks invalid: "${url.hostname}"`;
  return null;
}

/** Minimal CSV parser handling quoted fields (RFC 4180 subset, no embedded newlines). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function loadRows(file: string): { rows: Partial<ToolRow>[]; errors: string[] } {
  const raw = fs.readFileSync(file, "utf8");
  const errors: string[] = [];

  if (file.endsWith(".json")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return { rows: [], errors: [`invalid JSON: ${(e as Error).message}`] };
    }
    if (!Array.isArray(parsed)) return { rows: [], errors: ["JSON root must be an array"] };
    return { rows: parsed as Partial<ToolRow>[], errors };
  }

  // CSV
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], errors: ["CSV needs a header row and at least one data row"] };
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  for (const required of ["name", "category", "url"]) {
    if (!header.includes(required)) errors.push(`CSV header missing required column "${required}"`);
  }
  if (errors.length) return { rows: [], errors };

  const rows = lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = fields[i] ?? ""));
    return row as Partial<ToolRow>;
  });
  return { rows, errors };
}

function main() {
  const args = process.argv.slice(2);
  const merge = args.includes("--merge");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: pnpm import-tools <file.csv|file.json> [--merge]");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const { rows, errors } = loadRows(file);
  const validated: ToolRow[] = [];
  const seenSlugs = new Set<string>();

  rows.forEach((row, i) => {
    const rowNum = i + 1;
    const rowErrors: string[] = [];
    const name = (row.name ?? "").trim();
    const category = (row.category ?? "").trim().toLowerCase();
    const url = (row.url ?? "").trim();

    if (!name) rowErrors.push("missing name");
    if (!CATEGORIES.includes(category))
      rowErrors.push(`unknown category "${row.category}" (valid: ${CATEGORIES.join(", ")})`);
    const urlError = url ? validateUrl(url) : "missing url";
    if (urlError) rowErrors.push(urlError);

    const slug = (row.slug ?? "").trim() || slugify(name);
    if (!slug) rowErrors.push("could not derive a slug from name");
    if (seenSlugs.has(slug)) rowErrors.push(`duplicate slug "${slug}"`);

    if (rowErrors.length) {
      errors.push(`row ${rowNum} (${name || "?"}): ${rowErrors.join("; ")}`);
    } else {
      seenSlugs.add(slug);
      validated.push({
        slug,
        name,
        description: (row.description ?? "").trim() || name,
        category,
        url,
      });
    }
  });

  if (errors.length) {
    console.error(`Import rejected — ${errors.length} error(s), nothing written:\n`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  let output = validated;
  if (merge) {
    const existing: ToolRow[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    const importedSlugs = new Set(validated.map((t) => t.slug));
    output = [...existing.filter((t) => !importedSlugs.has(t.slug)), ...validated];
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`✓ Wrote ${output.length} tools to ${path.relative(process.cwd(), DATA_PATH)} (${validated.length} imported${merge ? ", merged with existing" : ""})`);
}

main();
