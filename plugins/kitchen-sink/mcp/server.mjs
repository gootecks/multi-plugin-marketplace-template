#!/usr/bin/env node
// A minimal stdio MCP server with no dependencies, shipped inside the plugin.
//
// Tools:
//   plugin_env     which plugin-root variables the host tool set, so you can
//                  see how Claude Code, Codex, Copilot and Cursor differ
//   recent_events  the last hook events logged by hooks/on-event.mjs
//
// Protocol: JSON-RPC 2.0, one message per line on stdin/stdout.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const LOG = process.env.KITCHEN_SINK_LOG || join(homedir(), ".kitchen-sink", "events.jsonl");
const VARS = [
  "CLAUDE_PLUGIN_ROOT",
  "CLAUDE_PLUGIN_DATA",
  "CLAUDE_PROJECT_DIR",
  "PLUGIN_ROOT",
  "PLUGIN_DATA",
  "CURSOR_PLUGIN_ROOT",
  "COPILOT_PLUGIN_ROOT",
];

const TOOLS = [
  {
    name: "plugin_env",
    description: "Show which plugin-root environment variables the host AI tool set for this MCP server, plus its working directory.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "recent_events",
    description: "Return the most recent hook events logged by the kitchen-sink plugin.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 200, default: 20 } },
      additionalProperties: false,
    },
  },
];

function callTool(name, args = {}) {
  if (name === "plugin_env") {
    const env = Object.fromEntries(VARS.map((v) => [v, process.env[v] ?? null]));
    return { cwd: process.cwd(), node: process.version, env };
  }
  if (name === "recent_events") {
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 200);
    let lines = [];
    try {
      lines = readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean);
    } catch {
      return { log: LOG, events: [], note: "No events logged yet." };
    }
    return { log: LOG, events: lines.slice(-limit).map((l) => JSON.parse(l)) };
  }
  throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
}

function reply(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}
function fail(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}

function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  switch (method) {
    case "initialize":
      return reply(id, {
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "kitchen-sink", version: "0.1.0" },
      });
    case "ping":
      return reply(id, {});
    case "tools/list":
      return reply(id, { tools: TOOLS });
    case "tools/call":
      try {
        const out = callTool(params?.name, params?.arguments);
        return reply(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        return fail(id, e.code ?? -32603, e.message);
      }
    default:
      // Notifications (no id), such as notifications/initialized, get no reply.
      if (isRequest) fail(id, -32601, `Method not found: ${method}`);
  }
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  try {
    handle(JSON.parse(line));
  } catch {
    fail(null, -32700, "Parse error");
  }
});
