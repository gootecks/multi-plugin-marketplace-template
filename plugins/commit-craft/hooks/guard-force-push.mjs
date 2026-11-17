#!/usr/bin/env node
// Blocks `git push --force` to main or master before the agent runs it.
//
// One script serves every vendor. It reads the hook payload from stdin,
// finds the shell command wherever that vendor puts it, and blocks by
// exiting with code 2 and a reason on stderr. Claude Code, Codex, Cursor
// and GitHub Copilot all treat exit code 2 as "deny".

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PROTECTED = new Set(["main", "master"]);

function readPayload() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Claude Code, Codex, Cursor preToolUse:  tool_input.command
// Cursor beforeShellExecution:            command
// Copilot CLI camelCase events:           toolArgs (JSON string) -> command
function findCommand(p) {
  if (typeof p?.tool_input?.command === "string") return p.tool_input.command;
  if (typeof p?.command === "string") return p.command;
  let args = p?.toolArgs;
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      return "";
    }
  }
  return typeof args?.command === "string" ? args.command : "";
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["symbolic-ref", "--short", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function isForcePushToProtected(segment, cwd) {
  const tokens = segment.trim().split(/\s+/);
  const git = tokens.indexOf("git");
  const push = git === -1 ? -1 : tokens.indexOf("push", git + 1);
  if (push === -1) return false;

  const rest = tokens.slice(push + 1);
  const flags = rest.filter((t) => t.startsWith("-"));
  const refs = rest.filter((t) => !t.startsWith("-")).slice(1); // drop the remote

  // --force-with-lease and --force-if-includes are the safe forms, so allow them.
  const forceFlag = flags.some((f) => f === "--force" || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(f));
  const plusRef = refs.some((r) => r.startsWith("+"));
  if (!forceFlag && !plusRef) return false;

  const targets = refs.map((r) => r.replace(/^\+/, "").split(":").pop());
  if (targets.length === 0) targets.push(currentBranch(cwd));
  return targets.some((t) => PROTECTED.has(t.replace(/^refs\/heads\//, "")));
}

const payload = readPayload();
const command = findCommand(payload);
const cwd = payload.cwd || process.cwd();

const blocked = command
  .split(/&&|\|\||;|\|/)
  .some((segment) => isForcePushToProtected(segment, cwd));

if (blocked) {
  process.stderr.write(
    "commit-craft: force-pushing to main or master is blocked. " +
      "Push to a feature branch, or use --force-with-lease on a branch you own.\n",
  );
  process.exit(2);
}
process.exit(0);
