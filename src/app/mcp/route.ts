/**
 * Public Model Context Protocol endpoint (Streamable HTTP, stateless) at /mcp.
 *
 * MCP clients (Claude Desktop, Cursor, etc.) POST JSON-RPC 2.0 requests here.
 * We support a single request or a JSON-RPC batch. Notifications get a bare 202
 * with no body. Runs on the Node runtime because the generation pipeline uses
 * the Anthropic SDK.
 */
import { dispatch, type JsonRpcRequest, type McpHandlers } from "@/lib/mcp/protocol";
import { TOOLS, callTool } from "@/lib/mcp/generateTool";
import { extractIp, hashIp } from "@/lib/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(): Promise<Response> {
  return json(
    {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message:
          "This is a Model Context Protocol endpoint. Send JSON-RPC 2.0 requests via POST. " +
          "Setup instructions: https://promptbuildr.ai/mcp",
      },
    },
    405,
  );
}

export async function POST(req: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: request body is not valid JSON." } }, 400);
  }

  const ctx = { ipHash: await hashIp(extractIp(req.headers)), now: new Date() };
  const handlers: McpHandlers = { tools: TOOLS, callTool };
  const handleOne = (r: unknown) => dispatch(r as JsonRpcRequest, handlers, ctx);

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request: empty batch." } }, 400);
    }
    const responses = (await Promise.all(payload.map(handleOne))).filter((r) => r !== null);
    // A batch of only notifications owes no response body.
    if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
    return json(responses);
  }

  const response = await handleOne(payload);
  if (response === null) return new Response(null, { status: 202, headers: CORS });
  return json(response);
}
