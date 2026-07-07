/**
 * The generation output contract: TypeScript types + the JSON Schema enforced
 * server-side via structured outputs (output_config.format). Haiku 4.5
 * supports structured outputs, so schema-valid JSON is guaranteed on the
 * happy path; parse.ts remains as the defensive fallback layer.
 */

export interface RawGenerationOutput {
  title: string;
  prompt: string;
  instructions: string[];
  recommended_tools: {
    name: string;
    registry_slug: string | null;
    homepage_url: string | null;
  }[];
  category_tags: string[];
  is_business: boolean;
  is_agent_or_automation: boolean;
  moderation: {
    verdict: "allow" | "block";
    reason: string | null;
  };
}

/** JSON Schema for output_config.format (structured outputs). */
export const GENERATION_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short descriptive title, max ~70 chars" },
    prompt: { type: "string", description: "The full ready-to-paste prompt text" },
    instructions: {
      type: "array",
      items: { type: "string" },
      description: "3-6 numbered setup steps for a non-expert",
    },
    recommended_tools: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          registry_slug: { type: ["string", "null"] },
          homepage_url: { type: ["string", "null"] },
        },
        required: ["name", "registry_slug", "homepage_url"],
        additionalProperties: false,
      },
    },
    category_tags: { type: "array", items: { type: "string" } },
    is_business: { type: "boolean" },
    is_agent_or_automation: { type: "boolean" },
    moderation: {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["allow", "block"] },
        reason: { type: ["string", "null"] },
      },
      required: ["verdict", "reason"],
      additionalProperties: false,
    },
  },
  required: [
    "title",
    "prompt",
    "instructions",
    "recommended_tools",
    "category_tags",
    "is_business",
    "is_agent_or_automation",
    "moderation",
  ],
  additionalProperties: false,
} as const;

/**
 * Structural validation of a parsed object (used on the defensive-parse path
 * and as a belt over structured outputs). Returns the typed object or a list
 * of problems.
 */
export function validateGenerationOutput(
  data: unknown,
): { ok: true; value: RawGenerationOutput } | { ok: false; problems: string[] } {
  const problems: string[] = [];
  if (typeof data !== "object" || data === null) {
    return { ok: false, problems: ["root is not an object"] };
  }
  const d = data as Record<string, unknown>;

  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  if (typeof d.title !== "string" || !d.title.trim()) problems.push("title must be a non-empty string");
  if (typeof d.prompt !== "string" || !d.prompt.trim()) problems.push("prompt must be a non-empty string");
  if (!isStringArray(d.instructions) || d.instructions.length === 0)
    problems.push("instructions must be a non-empty string array");
  if (!isStringArray(d.category_tags)) problems.push("category_tags must be a string array");
  if (typeof d.is_business !== "boolean") problems.push("is_business must be a boolean");
  if (typeof d.is_agent_or_automation !== "boolean") problems.push("is_agent_or_automation must be a boolean");

  if (!Array.isArray(d.recommended_tools)) {
    problems.push("recommended_tools must be an array");
  } else {
    d.recommended_tools.forEach((t, i) => {
      if (typeof t !== "object" || t === null || typeof (t as Record<string, unknown>).name !== "string") {
        problems.push(`recommended_tools[${i}] must be an object with a string name`);
      }
    });
  }

  const mod = d.moderation as Record<string, unknown> | undefined;
  if (typeof mod !== "object" || mod === null || (mod.verdict !== "allow" && mod.verdict !== "block")) {
    problems.push('moderation.verdict must be "allow" or "block"');
  }

  if (problems.length) return { ok: false, problems };
  return { ok: true, value: d as unknown as RawGenerationOutput };
}
