# How it works

## One source of truth

Every plugin is written in Claude Code's format. Each other tool gets each file in one of three ways, in this order of preference:

1. **It reads Claude's file directly.** Copilot CLI, VS Code and Codex all fall back to `.claude-plugin/` when they don't find their own manifest. Nothing to add.
2. **A symlink.** When a tool needs its own path but the format is identical, the file at its path is a relative symlink to Claude's. Cursor's marketplace and plugin manifests work this way.
3. **A real copy, kept in sync by the check.** When the format differs (Cursor, Copilot and Codex hook files; Codex TOML), the tool gets a small real file. Any vendor manifest that is a real file must have the same name, version, description and author as Claude's; `node scripts/check.mjs` fails if they drift.

## Lookup order: who reads what first

These orders decide everything. A tool stops at the first file it finds, so adding the "wrong" file silently hides Claude's.

### Marketplace file (repo root)

| Tool | Looks for, in order | What this repo gives it |
|------|---------------------|-------------------------|
| Claude Code | `.claude-plugin/marketplace.json` | the real file |
| Copilot CLI | `marketplace.json`, `.plugin/marketplace.json`, `.github/plugin/marketplace.json`, `.claude-plugin/marketplace.json` | falls through to Claude's |
| VS Code | Claude and Copilot locations | Claude's (inferred from its docs) |
| Codex | `.agents/plugins/marketplace.json`, `api_marketplace.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json` | falls through to Claude's |
| Cursor | `.cursor-plugin/marketplace.json` | symlink to Claude's |

### Plugin manifest (inside each plugin folder)

| Tool | Looks for, in order | What this repo gives it |
|------|---------------------|-------------------------|
| Claude Code | `.claude-plugin/plugin.json` | the real file |
| Copilot CLI, VS Code | root `plugin.json` with the Agent Plugins `$schema`, then `.plugin/plugin.json`, `plugin.json`, `.github/plugin/plugin.json`, `.claude-plugin/plugin.json` | Claude's, or a real `.github/plugin/plugin.json` when the plugin needs Copilot-format hooks |
| Codex | root `plugin.json` with the Agent Plugins `$schema`, then `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` | Claude's, or a real `.codex-plugin/plugin.json` when the plugin needs Codex-only hook events |
| Cursor | `.cursor-plugin/plugin.json` (a root Agent Plugins `plugin.json` supports only skills and MCP) | symlink to Claude's, or a real file when the plugin has hooks |

That is why the check fails on a root `plugin.json` or `.plugin/plugin.json`: Copilot and Codex would read it first and ignore Claude's.

## When to symlink and when to copy

| Situation | Do this |
|-----------|---------|
| Plugin has no hooks | `.cursor-plugin/plugin.json` is a symlink to `../.claude-plugin/plugin.json`; nothing else |
| Plugin has hooks that only use events Claude, Codex and Copilot share | Claude's `hooks/hooks.json` serves all three; give Cursor a real manifest with `"hooks": "./hooks/cursor-hooks.json"` ([commit-craft](../plugins/commit-craft)) |
| Plugin needs tool-native hook events (Copilot camelCase, Codex-only events) | add a real `.github/plugin/plugin.json` or `.codex-plugin/plugin.json` pointing at that tool's hooks file ([kitchen-sink](../plugins/kitchen-sink)) |
| Plugin has commands | list `"commands": "./commands/"` in Claude's manifest, because Copilot has no default commands folder. In Claude Code, `commands` replaces the default folder, so naming the default keeps it, and nothing loads twice (checked with `claude plugin details`) |
| Plugin has an MCP server and a real Cursor manifest | set `"mcpServers": "./.mcp.json"`, because Cursor's default is `mcp.json` without the dot |

## Everything a plugin uses must live inside it

Every tool requires component paths to stay inside the plugin folder:
- Claude Code needs `./` paths that resolve inside the plugin, and rejects symlinks that leave it (except links between plugins in the same marketplace).
- Codex needs `./` paths.
- Cursor forbids `..` and absolute paths.

So shared files are copied into each plugin, never referenced from a common folder. Example: each plugin has its own `LICENSE`.

## What happens to symlinks on install

| Tool | Behavior | Source |
|------|----------|--------|
| Claude Code | copies the plugin to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`; symlinks leading outside the plugin are rejected with "path escapes plugin directory" | [plugins loading docs](https://code.claude.com/docs/en/plugins/loading) |
| Copilot CLI | copies the plugin into `~/.copilot/installed-plugins/` and turns symlinks into real files | tested with 1.0.18 |
| Cursor | local plugins in `~/.cursor/plugins/local/` skip symlinks pointing outside the folder | [Cursor plugins docs](https://cursor.com/docs/plugins) |
| Gemini CLI | copies with `fs.cp`, which rewrites links as absolute paths into a temporary clone that is then deleted | gemini-cli source, `extension-manager.ts` |
| Windows, any tool | git checks symlinks out as small text files unless Developer Mode is on and `core.symlinks=true` is set before cloning | [copilot-cli#2286](https://github.com/github/copilot-cli/issues/2286) |

Only Cursor reads a file in this repo through a symlink, and only for its manifests, so the Windows problem affects Cursor users and contributors.
