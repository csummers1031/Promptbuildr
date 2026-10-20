# Promptbuildr MCP server

Promptbuildr exposes its prompt generator as a remote **Model Context Protocol
(MCP)** server, so any MCP client (Claude Desktop, Claude Code, Cursor, etc.)
can call it as a tool.

- **Endpoint:** `https://promptbuildr.ai/mcp`
- **Transport:** Streamable HTTP (stateless), JSON-RPC 2.0
- **Protocol version:** `2025-06-18`
- **Auth:** none (public). Rate-limited by IP.

## The tool

### `generate_prompt`
Turns a plain-language task into a production-ready, structured prompt
engineered for a specific AI tool — the same pipeline behind the website.

| Argument | Required | Default | Notes |
|---|---|---|---|
| `task` | yes | — | What you want the prompt to do (max 1000 chars). |
| `role` | no | `Other` | One of the Promptbuildr roles (Marketer, Founder/CEO, Sales/SDR, …). |
| `aiTool` | no | `Other/Any` | Which tool the prompt is for (Claude, ChatGPT, Gemini, …). |
| `outputType` | no | `Other` | Email/Outreach, Content/Copy, Strategy/Plan, Code/Automation, … |

Returns Markdown (the ready-to-paste prompt, how-to-use steps, and recommended
tools) plus a structured mirror (`title`, `prompt`, `instructions[]`,
`tools[]`, `categoryTags[]`, `isBusiness`, `aiTool`).

## Connect

### Claude Desktop / Claude Code
Add to your MCP config (`claude_desktop_config.json`, or `.mcp.json` for Claude
Code):

```json
{
  "mcpServers": {
    "promptbuildr": {
      "type": "http",
      "url": "https://promptbuildr.ai/mcp"
    }
  }
}
```

### Cursor
`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "promptbuildr": { "url": "https://promptbuildr.ai/mcp" }
  }
}
```

Then ask: *"Use promptbuildr to generate a cold-outreach prompt for Claude."*

## Try it with curl

List the tools:

```bash
curl -s https://promptbuildr.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Generate a prompt:

```bash
curl -s https://promptbuildr.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_prompt","arguments":{"task":"write a cold outreach email to a VP of Sales","role":"Sales/SDR","aiTool":"Claude","outputType":"Email/Outreach"}}}'
```

## Limits

- **Per IP:** 30 generations/hour.
- **Global:** the public server shares one monthly API budget. When it is
  exhausted, generation pauses until the next month. For unlimited use,
  self-host with your own Anthropic key (the server lives in this repo under
  `src/app/mcp/` and `src/lib/mcp/`).

## How it works

`src/app/mcp/route.ts` is a thin HTTP adapter over JSON-RPC
(`src/lib/mcp/protocol.ts`). `tools/call` runs the real `generatePrompt()`
pipeline via `src/lib/mcp/generateTool.ts`, which validates arguments, enforces
rate limits (`rateLimit.ts`), records API spend against the shared budget, and
formats the result (`format.ts`). v1 does **not** publish MCP generations to
the public feed.
