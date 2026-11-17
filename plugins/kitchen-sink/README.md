# kitchen-sink

A reference plugin with one of every component type and a logger on every hook event, for Claude Code, Codex, GitHub Copilot and Cursor. Install it to watch which events each tool fires, then copy the pieces you need.

> **Heads-up:** it runs a small Node script on every hook event, including every tool call, and appends one line per event to `~/.kitchen-sink/events.jsonl` (set `KITCHEN_SINK_LOG` to change the path). The log holds event and tool names, never prompt or command text. Uninstall or disable it when you're done.

## Components

| Component | File | Claude Code | Codex | Copilot | Cursor |
|-----------|------|:-:|:-:|:-:|:-:|
| Model-invoked skill with a reference file | [`skills/explain-hook-event/`](skills/explain-hook-event/SKILL.md) | ✓ | ✓ | ✓ | ✓ |
| User-invoked skill (`/show-events`) with a script | [`skills/show-events/`](skills/show-events/SKILL.md) | ✓ | ✓ | ✓ | ✓ |
| Legacy command (`/ping`) | [`commands/ping.md`](commands/ping.md) | ✓ | as a skill | ✓ | ✓ |
| Agent | [`agents/hook-debugger.md`](agents/hook-debugger.md) | ✓ | – | ✓ | ✓ |
| Hooks, Claude format: 31 events | [`hooks/hooks.json`](hooks/hooks.json) | ✓ | | | |
| Hooks, Codex: 14 events | [`hooks/codex-hooks.json`](hooks/codex-hooks.json) | | ✓ | | |
| Hooks, Copilot / VS Code format: 13 events | [`hooks/copilot-hooks.json`](hooks/copilot-hooks.json) | | | ✓ | |
| Hooks, Cursor format: 21 events | [`hooks/cursor-hooks.json`](hooks/cursor-hooks.json) | | | | ✓ |
| One hook script for all four | [`hooks/on-event.mjs`](hooks/on-event.mjs) | ✓ | ✓ | ✓ | ✓ |
| Stdio MCP server shipped in the plugin | [`mcp/server.mjs`](mcp/server.mjs), [`.mcp.json`](.mcp.json) | ✓ | ✓ | ✓ | ✓ |
| Output style | [`output-styles/field-notes.md`](output-styles/field-notes.md) | ✓ | – | – | – |
| Rule | [`rules/hook-scripts.mdc`](rules/hook-scripts.mdc) | – | – | – | ✓ |

Every event, what it can do and its equivalent in the other tools are listed in [`skills/explain-hook-event/references/events.md`](skills/explain-hook-event/references/events.md).

Claude Code's hooks file leaves out two events on purpose:

- **`WorktreeCreate`** replaces Claude Code's own worktree creation, so a logging-only handler would break worktrees.
- **`MessageDisplay`** fires for every chunk of streamed output.

Copilot CLI 1.0.18 doesn't load `userPromptTransformed`, so its file has 13 events, not 14.

## One manifest per tool

Copilot, Codex and Cursor each need their own hooks file here, so each gets a real manifest that points at it. Each manifest has the same name, version, description and author as Claude's; `node scripts/check.mjs` fails if they differ.

| Manifest | Read by | Differs from Claude's in |
|----------|---------|--------------------------|
| [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) | Claude Code | (source of truth) |
| [`.github/plugin/plugin.json`](.github/plugin/plugin.json) | Copilot CLI, VS Code | `hooks`, plus explicit `skills`, `agents`, `commands`, `mcpServers` |
| [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json) | Codex | `hooks`, an inline `mcpServers` with `cwd: "."` (Codex doesn't expand `${CLAUDE_PLUGIN_ROOT}` in `.mcp.json`), `interface` |
| [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json) | Cursor | `hooks`, `mcpServers` (Cursor looks for `mcp.json` without the dot) |

## The MCP server

`mcp/server.mjs` is about 100 lines of dependency-free Node that speaks MCP over stdio. It has two tools:

- `plugin_env` shows which plugin-root variables the host set (`CLAUDE_PLUGIN_ROOT`, `PLUGIN_ROOT`, `CURSOR_PLUGIN_ROOT` and others), which is how you find out what a tool really provides.
- `recent_events` returns the last hook events from the log.
