import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "@/lib/generate";
import { presentGeneration } from "@/lib/present";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import {
  COOKIE_ANON,
  COOKIE_SESSION,
  extractIp,
  hashIp,
  randomId,
  signValue,
  verifyValue,
  type AnonData,
  type SessionData,
} from "@/lib/identity";
import { checkRateLimit, rateMessage } from "@/lib/rateLimit";
import { recordSpend } from "@/lib/spend";
import {
  recordGeneration,
  storePrompt,
  recordToolOpportunities,
  recordModerationBlock,
} from "@/db/repo";

export const runtime = "nodejs";

const MAX_TASK_LENGTH = 1000;
const ANON_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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
    return NextResponse.json({ error: `task is required (max ${MAX_TASK_LENGTH} chars)` }, { status: 400 });
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

  // --- identity ---
  const now = new Date();
  const ip = extractIp(req.headers);
  const ipHash = await hashIp(ip);
  const session = await verifyValue<SessionData>(req.cookies.get(COOKIE_SESSION)?.value);
  const anon = await verifyValue<AnonData>(req.cookies.get(COOKIE_ANON)?.value);
  const anonAlreadyUsed = Boolean(anon) && !session;

  // --- rate + spend gate ---
  const decision = await checkRateLimit({
    now,
    ipHash,
    anonAlreadyUsed,
    userId: session?.userId ?? null,
  });
  if (!decision.allowed) {
    return NextResponse.json(
      {
        status: "gate",
        requiresEmail: Boolean(decision.requiresEmailNext),
        message: rateMessage(decision.reason),
      },
      { status: 200 },
    );
  }

  // --- generate ---
  const result = await generatePrompt({ task, role, aiTool, outputType });
  const ctx = { role, outputType, aiTool };

  // Record spend whenever the model was actually called.
  if (result.status !== "blocked" || result.usage) {
    const usage =
      result.status === "ok" || result.status === "error" || result.status === "blocked"
        ? result.usage
        : undefined;
    if (usage) await recordSpend(now, usage.estimatedCostUsd);
  }

  if (result.status === "error") {
    console.error("generation error:", result.reason);
    return NextResponse.json(
      { status: "error", message: "Generation failed. Please try again." },
      { status: 502 },
    );
  }

  // Input-blocklist blocks never produce output — return a bare blocked message.
  if (result.status === "blocked" && !result.output) {
    await recordModerationBlock(
      null,
      result.stage === "model-moderation" ? "model" : "blocklist",
      result.reason,
      result.hits?.[0]?.pattern,
    );
    await recordGeneration({
      userId: session?.userId ?? null,
      ipHash,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      costUsd: result.usage?.estimatedCostUsd ?? 0,
      promptId: null,
    });
    return NextResponse.json({
      status: "blocked",
      result: null,
      message:
        "This request can't be turned into a prompt because it appears to violate our content policy.",
    });
  }

  const output = result.output;
  if (!output) {
    // Unreachable: ok always has output; blocked-without-output handled above.
    return NextResponse.json({ status: "error", message: "Generation failed." }, { status: 502 });
  }
  const presented = presentGeneration(output, ctx);
  const isOk = result.status === "ok";

  // --- persist (no-ops without DB) ---
  const promptId = await storePrompt({
    presented,
    taskInput: task,
    role,
    aiTool,
    outputType,
    isAgentOrAutomation: output.is_agent_or_automation,
    recommendedTools: output.recommended_tools,
    source: "user",
    userId: session?.userId ?? null,
    status: isOk ? "published" : "blocked",
    moderation: output.moderation,
  });

  await recordGeneration({
    userId: session?.userId ?? null,
    ipHash,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    costUsd: result.usage?.estimatedCostUsd ?? 0,
    promptId: isOk ? promptId : null,
  });

  if (isOk && result.status === "ok") {
    await recordToolOpportunities(result.offRegistry, promptId);
  }
  if (!isOk && result.status === "blocked") {
    await recordModerationBlock(
      promptId,
      result.stage === "model-moderation" ? "model" : "blocklist",
      result.reason,
      result.hits?.[0]?.pattern,
    );
  }

  // --- response + anon cookie ---
  const payload = isOk
    ? { status: "ok", result: presented }
    : {
        status: "blocked",
        result: presented,
        message:
          "This request couldn't be published because it appears to violate our content policy. You can still copy it below for your own use.",
      };

  const res = NextResponse.json(payload);

  // Mark the anonymous free generation as consumed.
  if (!session && !anon) {
    const cookie = await signValue<AnonData>({ id: randomId(), createdAt: now.getTime() });
    res.cookies.set(COOKIE_ANON, cookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ANON_MAX_AGE,
      path: "/",
    });
  }

  return res;
}
