import { describe, expect, it, vi } from "vitest";
import { dispatch, MCP_PROTOCOL_VERSION, SERVER_INFO, type McpContext, type McpHandlers, type ToolResult } from "@/lib/mcp/protocol";
import { validateGenerateArgs, GENERATE_TOOL, TOOLS } from "@/lib/mcp/generateTool";
import { toMarkdown, toStructured } from "@/lib/mcp/format";
import type { PresentedGeneration } from "@/lib/present";

const ctx: McpContext = { ipHash: "test-ip", now: new Date("2026-01-01T00:00:00Z") };

function stubHandlers(result: ToolResult = { content: [{ type: "text", text: "stub" }] }): McpHandlers & {
  callTool: ReturnType<typeof vi.fn>;
} {
  const callTool = vi.fn(async () => result);
  return { tools: TOOLS, callTool };
}

describe("dispatch", () => {
  it("initialize returns the protocol version and server info", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 1, method: "initialize" }, stubHandlers(), ctx);
    expect(res?.result).toMatchObject({ protocolVersion: MCP_PROTOCOL_VERSION, serverInfo: SERVER_INFO });
  });

  it("ping returns an empty result", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 2, method: "ping" }, stubHandlers(), ctx);
    expect(res?.result).toEqual({});
  });

  it("tools/list advertises generate_prompt", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 3, method: "tools/list" }, stubHandlers(), ctx);
    const tools = (res?.result as { tools: { name: string }[] }).tools;
    expect(tools.some((t) => t.name === "generate_prompt")).toBe(true);
  });

  it("notifications get no response", async () => {
    const res = await dispatch({ jsonrpc: "2.0", method: "notifications/initialized" }, stubHandlers(), ctx);
    expect(res).toBeNull();
  });

  it("an unknown method returns -32601", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 4, method: "bogus/method" }, stubHandlers(), ctx);
    expect(res?.error?.code).toBe(-32601);
  });

  it("tools/call with an unknown tool returns -32602", async () => {
    const res = await dispatch(
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "nope", arguments: {} } },
      stubHandlers(),
      ctx,
    );
    expect(res?.error?.code).toBe(-32602);
  });

  it("tools/call routes name and arguments to the handler", async () => {
    const h = stubHandlers();
    const res = await dispatch(
      { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "generate_prompt", arguments: { task: "x" } } },
      h,
      ctx,
    );
    expect(h.callTool).toHaveBeenCalledWith("generate_prompt", { task: "x" }, ctx);
    expect(res?.result).toMatchObject({ content: [{ type: "text", text: "stub" }] });
  });
});

describe("validateGenerateArgs", () => {
  it("requires a task", () => {
    expect(validateGenerateArgs({}).ok).toBe(false);
    expect(validateGenerateArgs({ task: "   " }).ok).toBe(false);
  });

  it("applies defaults for role, aiTool and outputType", () => {
    expect(validateGenerateArgs({ task: "write a cold email" })).toMatchObject({
      ok: true,
      value: { role: "Other", aiTool: "Other/Any", outputType: "Other" },
    });
  });

  it("accepts valid enum values", () => {
    expect(
      validateGenerateArgs({ task: "x", role: "Marketer", aiTool: "Claude", outputType: "Email/Outreach" }),
    ).toMatchObject({ ok: true, value: { role: "Marketer", aiTool: "Claude", outputType: "Email/Outreach" } });
  });

  it("rejects an invalid enum value", () => {
    expect(validateGenerateArgs({ task: "x", role: "Astronaut" }).ok).toBe(false);
    expect(validateGenerateArgs({ task: "x", aiTool: "Bard" }).ok).toBe(false);
  });

  it("rejects an over-long task", () => {
    expect(validateGenerateArgs({ task: "a".repeat(1001) }).ok).toBe(false);
  });
});

describe("tool schema", () => {
  it("requires task and forbids unknown input properties", () => {
    const schema = GENERATE_TOOL.inputSchema as { required: string[]; additionalProperties: boolean };
    expect(schema.required).toEqual(["task"]);
    expect(schema.additionalProperties).toBe(false);
  });
});

describe("format", () => {
  const presented: PresentedGeneration = {
    title: "Cold Outreach Email",
    prompt: "You are a world-class SDR. Write a concise cold email.",
    instructions: [
      [
        { type: "text", value: "Paste this into " },
        { type: "link", value: "Instantly", href: "https://refer.instantly.ai/abc" },
      ],
      [{ type: "text", value: "Review the draft and send." }],
    ],
    toolLinks: [
      { name: "Instantly", href: "https://refer.instantly.ai/abc", source: "registry" },
      { name: "SomeTool", href: null, source: "none" },
    ],
    cta: null,
    categoryTags: ["sales", "email"],
    isBusiness: true,
    aiTool: "Claude",
  };

  it("markdown includes the title, prompt, numbered steps and affiliate links", () => {
    const md = toMarkdown(presented);
    expect(md).toContain("# Cold Outreach Email");
    expect(md).toContain("You are a world-class SDR");
    expect(md).toContain("1. Paste this into [Instantly](https://refer.instantly.ai/abc)");
    expect(md).toContain("2. Review the draft and send.");
    expect(md).toContain("- [Instantly](https://refer.instantly.ai/abc)");
  });

  it("markdown omits tools that have no link", () => {
    expect(toMarkdown(presented)).not.toContain("SomeTool");
  });

  it("wraps a prompt containing a code fence in a longer fence", () => {
    const md = toMarkdown({ ...presented, prompt: "Example:\n```js\nconst x = 1;\n```" });
    expect(md).toContain("````text");
  });

  it("structuredContent lists linked tools with urls and flattens instructions to plain text", () => {
    const s = toStructured(presented) as { tools: { name: string; url: string }[]; instructions: string[] };
    expect(s.tools).toEqual([{ name: "Instantly", url: "https://refer.instantly.ai/abc" }]);
    expect(s.instructions[0]).toBe("Paste this into Instantly");
    expect(s.instructions[1]).toBe("Review the draft and send.");
  });
});
