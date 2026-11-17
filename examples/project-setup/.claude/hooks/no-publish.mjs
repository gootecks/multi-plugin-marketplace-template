#!/usr/bin/env node
// Project hook: stop agents from publishing packages. Blocks npm, yarn and
// pnpm publish by exiting with code 2, which Claude Code, Codex, Cursor and
// Copilot all treat as "deny".

import { readFileSync } from "node:fs";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {}

let args = payload.toolArgs;
if (typeof args === "string") {
  try {
    args = JSON.parse(args);
  } catch {}
}
const command = payload.tool_input?.command ?? payload.command ?? args?.command ?? "";

if (/\b(npm|yarn|pnpm)\s+(publish|release)\b/.test(command)) {
  process.stderr.write("Publishing is done by CI, not by agents. Open a pull request instead.\n");
  process.exit(2);
}
process.exit(0);
