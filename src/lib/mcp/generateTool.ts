/**
 * The `generate_prompt` MCP tool: validate arguments, enforce rate limits, run
 * the REAL generation pipeline (the same generatePrompt the web app uses), then
 * format the result for MCP. v1 does not persist or promote to the public feed
 * (avoids flooding it with API traffic), but it DOES record API spend so the
 * shared budget circuit breaker stays accurate.
 */
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import { generatePrompt } from "@/lib/generate";
import { presentGeneration } from "@/lib/present";
import { recordSpend } from "@/lib/spend";
import { checkMcpRateLimit } from "./rateLimit";
import { toMarkdown, toStructured } from "./format";
import type { McpContext, McpTool, ToolResult } from "./protocol";

const MAX_TASK = 1000;

export interface ValidatedArgs {
  task: string;
  role: string;
  aiTool: string;
  outputType: string;
}

export type ValidateResult = { ok: true; value: ValidatedArgs } | { ok: false; error: string };

/** Resolve an optional enum arg: blank => fallback default; invalid => null (rejected). */
function pick(raw: unknown, allowed: readonly string[], fallback: string): string | null {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw !== "string") return null;
  return allowed.includes(raw) ? raw : null;
}

export function validateGenerateArgs(args: Record<string, unknown>): ValidateResult {
  const task = typeof args.task === "string" ? args.task.trim() : "";
  if (!task) {
    return { ok: false, error: "The 'task' argument is required: describe in plain language what you want the prompt to do." };
  }
  if (task.length > MAX_TASK) {
    return { ok: false, error: "The 'task' argument is too long (max " + MAX_TASK + " characters)." };
  }

  const role = pick(args.role, ROLES, "Other");
  if (role === null) return { ok: false, error: "Invalid 'role'. Allowed values: " + ROLES.join(", ") };

  const aiTool = pick(args.aiTool, AI_TOOLS, "Other/Any");
  if (aiTool === null) return { ok: false, error: "Invalid 'aiTool'. Allowed values: " + AI_TOOLS.join(", ") };

  const outputType = pick(args.outputType, OUTPUT_TYPES, "Other");
  if (outputType === null) return { ok: false, error: "Invalid 'outputType'. Allowed values: " + OUTPUT_TYPES.join(", ") };

  return { ok: true, value: { task, role, aiTool, outputType } };
}

export const GENERATE_TOOL: McpTool = {
  name: "generate_prompt",
  title: "Generate an optimized prompt",
  description:
    "Turn a plain-language description of a task into a production-ready, structured prompt engineered for a specific AI tool. " +
    "Returns the ready-to-paste prompt, step-by-step instructions, and recommended tools. Powered by Promptbuildr (https://promptbuildr.ai).",
  inputSchema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        maxLength: MAX_TASK,
        description: "What you want the prompt to accomplish. Plain language is fine.",
      },
      role: {
        type: "string",
        enum: [...ROLES],
        description: "Who the prompt is for. Optional; defaults to Other.",
      },
      aiTool: {
        type: "string",
        enum: [...AI_TOOLS],
        description: "Which AI tool the prompt will be pasted into. Optional; defaults to Other/Any.",
      },
      outputType: {
        type: "string",
        enum: [...OUTPUT_TYPES],
        description: "The kind of output you want. Optional; defaults to Other.",
      },
    },
    required: ["task"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      prompt: { type: "string" },
      instructions: { type: "array", items: { type: "string" } },
      tools: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, url: { type: "string" } },
          required: ["name", "url"],
        },
      },
      categoryTags: { type: "array", items: { type: "string" } },
      isBusiness: { type: "boolean" },
      aiTool: { type: "string" },
    },
    required: ["title", "prompt", "instructions"],
    additionalProperties: true,
  },
};

export const TOOLS: McpTool[] = [GENERATE_TOOL];

function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

export async function runGenerateTool(args: Record<string, unknown>, ctx: McpContext): Promise<ToolResult> {
  const v = validateGenerateArgs(args);
  if (!v.ok) return errorResult(v.error);

  const gate = await checkMcpRateLimit(ctx.ipHash, ctx.now);
  if (!gate.ok) return errorResult(gate.reason || "Rate limited. Try again later.");

  let result;
  try {
    result = await generatePrompt({
      task: v.value.task,
      role: v.value.role,
      aiTool: v.value.aiTool,
      outputType: v.value.outputType,
    });
  } catch (e) {
    return errorResult("Generation failed: " + (e instanceof Error ? e.message : "unknown error."));
  }

  // Record spend whenever the model ran (ok, or blocked after generating).
  if (result.usage) {
    try {
      await recordSpend(ctx.now, result.usage.estimatedCostUsd);
    } catch {
      // best-effort; never fail the user's response on a spend-write error
    }
  }

  if (result.status === "blocked") {
    return errorResult("This request was blocked by content moderation: " + result.reason);
  }
  if (result.status === "error") {
    return errorResult("Generation error: " + result.reason);
  }

  const presented = presentGeneration(result.output, {
    role: v.value.role,
    outputType: v.value.outputType,
    aiTool: v.value.aiTool,
  });

  return {
    content: [{ type: "text", text: toMarkdown(presented) }],
    structuredContent: toStructured(presented),
  };
}

/** Tool router for the HTTP adapter. */
export async function callTool(name: string, args: Record<string, unknown>, ctx: McpContext): Promise<ToolResult> {
  if (name === GENERATE_TOOL.name) return runGenerateTool(args, ctx);
  return errorResult("Unknown tool: " + name);
}
