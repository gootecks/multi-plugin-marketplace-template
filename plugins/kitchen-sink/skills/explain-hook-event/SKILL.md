---
name: explain-hook-event
description: Explain an AI coding agent hook event (SessionStart, PreToolUse, beforeShellExecution, agentStop and the rest) for Claude Code, Codex, GitHub Copilot, VS Code or Cursor, including what it can block, what it can add, and its equivalent in the other tools. Use when someone asks what a hook event does, which event to use for a task, or how to port a hook to another tool.
---

# Explain a hook event

This is the **model-invoked** skill example: the agent loads it when a question matches the description above. It also shows a skill that bundles a reference file.

1. Find the event in [references/events.md](references/events.md). Names differ in case and wording between tools (`PreToolUse`, `preToolUse`, `beforeShellExecution`), so match on meaning, not spelling.
2. Answer with:
   - when it fires
   - what it can do: block, add context, change input, or nothing
   - how to block: exit code 2 with a reason on stderr works in Claude Code, Codex, Copilot and Cursor; the JSON alternatives differ per tool
   - the nearest event in each of the other tools, or "none"
3. If the user is writing a hook, point them at `hooks/on-event.mjs` in this plugin, which shows one script handling all four tools' payloads and output formats.
