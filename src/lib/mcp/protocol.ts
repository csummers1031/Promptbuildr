/**
 * Minimal JSON-RPC 2.0 / Model Context Protocol plumbing for the public MCP
 * endpoint at /mcp (Streamable HTTP, stateless). We implement just the methods
 * a client needs to discover and call our single tool:
 *   initialize, ping, tools/list, tools/call, and notifications/* (no reply).
 *
 * Kept transport-agnostic and side-effect-free so it can be unit-tested without
 * a request: the HTTP adapter (src/app/mcp/route.ts) handles parsing and I/O.
 */

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const SERVER_INFO = { name: "Promptbuildr", version: "1.0.0" } as const;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  /** Absent on notifications (no response expected). */
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

/** One block of tool output. We only emit plain text. */
export interface ToolContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: ToolContent[];
  /** Machine-readable mirror of the text, validated against a tool's outputSchema. */
  structuredContent?: Record<string, unknown>;
  /** true => the call ran but the tool reports a user-level error (not a protocol error). */
  isError?: boolean;
}

export interface McpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/** Per-request context threaded to tool handlers (never serialized to the client). */
export interface McpContext {
  ipHash: string;
  now: Date;
}

export interface McpHandlers {
  tools: McpTool[];
  callTool(name: string, args: Record<string, unknown>, ctx: McpContext): Promise<ToolResult>;
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function fail(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

/**
 * Route one JSON-RPC request to a handler. Returns the response, or null when
 * no response is owed (notifications, or a malformed request with no id).
 */
export async function dispatch(
  req: JsonRpcRequest,
  handlers: McpHandlers,
  ctx: McpContext,
): Promise<JsonRpcResponse | null> {
  const isNotification = req == null || req.id === undefined;

  if (!req || typeof req.method !== "string") {
    return isNotification ? null : fail(req?.id ?? null, -32600, "Invalid Request: missing method.");
  }

  // Notifications (no id) and the notifications/* namespace never get a reply.
  if (isNotification || req.method.startsWith("notifications/")) return null;

  const id = req.id ?? null;

  try {
    switch (req.method) {
      case "initialize":
        return ok(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
        });

      case "ping":
        return ok(id, {});

      case "tools/list":
        return ok(id, { tools: handlers.tools });

      case "tools/call": {
        const params = (req.params ?? {}) as { name?: unknown; arguments?: unknown };
        const name = typeof params.name === "string" ? params.name : "";
        if (!name || !handlers.tools.some((t) => t.name === name)) {
          return fail(id, -32602, `Unknown tool: ${name || "(none)"}`);
        }
        const args =
          params.arguments && typeof params.arguments === "object"
            ? (params.arguments as Record<string, unknown>)
            : {};
        return ok(id, await handlers.callTool(name, args, ctx));
      }

      default:
        return fail(id, -32601, `Method not found: ${req.method}`);
    }
  } catch (e) {
    return fail(id, -32603, e instanceof Error ? e.message : "Internal error");
  }
}
