import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "@/lib/generate";
import { presentGeneration } from "@/lib/present";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";

export const runtime = "nodejs";

const MAX_TASK_LENGTH = 1000;

/**
 * POST /api/generate
 * Phase 1: input validation + full generation pipeline.
 * Phase 2 adds: rate limiting (anonymous 1-lifetime / 15-day accounts),
 * spend circuit breaker, DB persistence, tool_opportunities logging.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const task = typeof b.task === "string" ? b.task.trim() : "";
  const role = typeof b.role === "string" ? b.role : "";
  const aiTool = typeof b.aiTool === "string" ? b.aiTool : "";
  const outputType = typeof b.outputType === "string" ? b.outputType : "";

  if (!task || task.length > MAX_TASK_LENGTH) {
    return NextResponse.json(
      { error: `task is required (max ${MAX_TASK_LENGTH} chars)` },
      { status: 400 },
    );
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  if (!(AI_TOOLS as readonly string[]).includes(aiTool)) {
    return NextResponse.json({ error: "invalid aiTool" }, { status: 400 });
  }
  if (!(OUTPUT_TYPES as readonly string[]).includes(outputType)) {
    return NextResponse.json({ error: "invalid outputType" }, { status: 400 });
  }

  const result = await generatePrompt({ task, role, aiTool, outputType });

  const ctx = { role, outputType, aiTool };

  switch (result.status) {
    case "ok":
      // usage stays server-side (spend tracking), never sent to the client
      return NextResponse.json({
        status: "ok",
        result: presentGeneration(result.output, ctx),
      });
    case "blocked":
      // Blocked content renders privately to the creator only (never published).
      return NextResponse.json(
        {
          status: "blocked",
          result: result.output ? presentGeneration(result.output, ctx) : null,
          message:
            "This request couldn't be published because it appears to violate our content policy. You can still copy it below for your own use.",
        },
        { status: 200 },
      );
    case "error":
      console.error("generation error:", result.reason);
      return NextResponse.json(
        { status: "error", message: "Generation failed. Please try again." },
        { status: 502 },
      );
  }
}
