import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, MODEL_PRICING_PER_MTOK } from "@/config/constants";
import { buildSystemPrompt, buildUserMessage, type GenerationInput } from "@/lib/prompt/metaPrompt";
import { GENERATION_OUTPUT_SCHEMA, validateGenerationOutput, type RawGenerationOutput } from "@/lib/prompt/schema";
import { parseModelJson } from "@/lib/prompt/parse";
import { checkTaskInput, checkPublicText, type BlocklistHit } from "@/lib/moderation/blocklist";
import { validateRecommendations, offRegistryRefs, type ToolRef } from "@/lib/tools/resolve";

export interface GenerationUsage {
  inputTokens: number;
  outputTokens: number;
  /** USD, computed from verified per-model pricing — feeds the monthly spend tracker (Phase 2). */
  estimatedCostUsd: number;
}

export type GenerationResult =
  | {
      status: "ok";
      output: Omit<RawGenerationOutput, "recommended_tools"> & { recommended_tools: ToolRef[] };
      /** Off-registry recommendations — tool_opportunities feed (Phase 2 persists these). */
      offRegistry: ToolRef[];
      usage: GenerationUsage;
    }
  | {
      status: "blocked";
      stage: "blocklist-input" | "blocklist-output" | "model-moderation";
      reason: string;
      hits?: BlocklistHit[];
      /** Present when the model generated content before blocking — shown privately to the creator only. */
      output?: Omit<RawGenerationOutput, "recommended_tools"> & { recommended_tools: ToolRef[] };
      usage?: GenerationUsage;
    }
  | { status: "error"; reason: string; usage?: GenerationUsage };

function getModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING_PER_MTOK[model] ?? MODEL_PRICING_PER_MTOK[DEFAULT_MODEL];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// System prompt is byte-stable per process — cacheable prefix.
const SYSTEM_PROMPT = buildSystemPrompt();

async function callModel(
  input: GenerationInput,
  retryNote?: string,
): Promise<{ text: string; stopReason: string | null; inputTokens: number; outputTokens: number }> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserMessage(input) },
  ];
  if (retryNote) messages.push({ role: "user", content: retryNote });

  const response = await getClient().messages.create({
    model: getModel(),
    max_tokens: 4096,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages,
    output_config: {
      format: { type: "json_schema", schema: GENERATION_OUTPUT_SCHEMA as unknown as Record<string, unknown> },
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    text,
    stopReason: response.stop_reason,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

function tryParse(text: string): { ok: true; value: RawGenerationOutput } | { ok: false; error: string } {
  const parsed = parseModelJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const validated = validateGenerationOutput(parsed.value);
  if (!validated.ok) return { ok: false, error: validated.problems.join("; ") };
  return { ok: true, value: validated.value };
}

/**
 * Full generation pipeline: input blocklist -> model call (structured output)
 * -> defensive parse with one retry -> tool-recommendation validation ->
 * output blocklist + model moderation verdict.
 */
export async function generatePrompt(input: GenerationInput): Promise<GenerationResult> {
  // 1. Cheap first pass before spending API money
  const inputCheck = checkTaskInput(input.task);
  if (inputCheck.blocked) {
    return {
      status: "blocked",
      stage: "blocklist-input",
      reason: `blocklist: ${inputCheck.hits.map((h) => h.category).join(", ")}`,
      hits: inputCheck.hits,
    };
  }

  // 2. Model call, one retry on parse failure (per spec)
  let totalIn = 0;
  let totalOut = 0;
  let raw: RawGenerationOutput | null = null;

  try {
    const first = await callModel(input);
    totalIn += first.inputTokens;
    totalOut += first.outputTokens;

    if (first.stopReason === "refusal") {
      return {
        status: "blocked",
        stage: "model-moderation",
        reason: "model refused the request",
        usage: { inputTokens: totalIn, outputTokens: totalOut, estimatedCostUsd: costUsd(getModel(), totalIn, totalOut) },
      };
    }
    if (first.stopReason === "max_tokens") {
      return {
        status: "error",
        reason: "output truncated (max_tokens)",
        usage: { inputTokens: totalIn, outputTokens: totalOut, estimatedCostUsd: costUsd(getModel(), totalIn, totalOut) },
      };
    }

    const parsed = tryParse(first.text);
    if (parsed.ok) {
      raw = parsed.value;
    } else {
      const retry = await callModel(
        input,
        `Your previous response was not valid JSON matching the required schema (${parsed.error}). Respond again with ONLY the JSON object.`,
      );
      totalIn += retry.inputTokens;
      totalOut += retry.outputTokens;
      const reparsed = tryParse(retry.text);
      if (!reparsed.ok) {
        return {
          status: "error",
          reason: `model output unparseable after retry: ${reparsed.error}`,
          usage: { inputTokens: totalIn, outputTokens: totalOut, estimatedCostUsd: costUsd(getModel(), totalIn, totalOut) },
        };
      }
      raw = reparsed.value;
    }
  } catch (e) {
    return { status: "error", reason: `API call failed: ${(e as Error).message}` };
  }

  const usage: GenerationUsage = {
    inputTokens: totalIn,
    outputTokens: totalOut,
    estimatedCostUsd: costUsd(getModel(), totalIn, totalOut),
  };

  // 3. Server-side tool validation (never trust model slugs/URLs)
  const recommendedTools = validateRecommendations(raw.recommended_tools);
  const output = { ...raw, recommended_tools: recommendedTools };

  // 4. Moderation: model verdict + hard blocklist on public-facing text
  if (raw.moderation.verdict === "block") {
    return {
      status: "blocked",
      stage: "model-moderation",
      reason: raw.moderation.reason ?? "model moderation verdict",
      output,
      usage,
    };
  }
  const publicText = [raw.title, raw.prompt, ...raw.instructions].join("\n");
  const outputCheck = checkPublicText(publicText);
  if (outputCheck.blocked) {
    return {
      status: "blocked",
      stage: "blocklist-output",
      reason: `blocklist: ${outputCheck.hits.map((h) => h.category).join(", ")}`,
      hits: outputCheck.hits,
      output,
      usage,
    };
  }

  return { status: "ok", output, offRegistry: offRegistryRefs(recommendedTools), usage };
}
