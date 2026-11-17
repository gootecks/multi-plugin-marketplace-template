#!/usr/bin/env node
// Logs every hook event to ~/.kitchen-sink/events.jsonl so you can see which
// events each tool fires, and in what order.
//
//   node on-event.mjs <vendor> <event>
//
// vendor is claude, codex, copilot or cursor; each vendor's hooks file passes
// its own name. The script never blocks anything. It records the event name,
// the tool name and which payload keys arrived, never prompt or command text.
//
// On session start it also adds one line of context, which shows the
// different output shape each vendor expects.

import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const [vendor = "unknown", eventArg = ""] = process.argv.slice(2);
const LOG = process.env.KITCHEN_SINK_LOG || join(homedir(), ".kitchen-sink", "events.jsonl");
const MAX_BYTES = 1_000_000;

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // Some events send no payload.
}

const event = eventArg || payload.hook_event_name || "unknown";
let toolArgs = payload.toolArgs;
if (typeof toolArgs === "string") {
  try {
    toolArgs = JSON.parse(toolArgs);
  } catch {
    toolArgs = undefined;
  }
}

const entry = {
  ts: new Date().toISOString(),
  vendor,
  event,
  tool: payload.tool_name ?? payload.toolName ?? undefined,
  source: payload.source ?? payload.trigger ?? undefined,
  keys: Object.keys(payload).sort(),
  argKeys: toolArgs && typeof toolArgs === "object" ? Object.keys(toolArgs).sort() : undefined,
};

try {
  mkdirSync(dirname(LOG), { recursive: true });
  try {
    if (statSync(LOG).size > MAX_BYTES) renameSync(LOG, `${LOG}.1`);
  } catch {
    // No log yet.
  }
  appendFileSync(LOG, `${JSON.stringify(entry)}\n`);
} catch {
  // Logging must never break the agent.
}

const context = `kitchen-sink is installed: ${vendor} hook events are being logged to ${LOG}.`;
const isSessionStart = event === "SessionStart" || event === "sessionStart";

// Output contract per vendor:
//   Claude Code, Codex: print nothing for "no opinion"; context goes in hookSpecificOutput.
//   Copilot: print {} for "no opinion"; context is a top-level additionalContext.
//   Cursor: print {} (permission hooks treat invalid or empty output as a block);
//           context is additional_context.
if (vendor === "claude" || vendor === "codex") {
  if (isSessionStart) {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }),
    );
  }
} else if (vendor === "copilot") {
  process.stdout.write(JSON.stringify(isSessionStart ? { additionalContext: context } : {}));
} else if (vendor === "cursor") {
  process.stdout.write(JSON.stringify(isSessionStart ? { additional_context: context } : {}));
}
process.exit(0);
