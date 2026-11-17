# Project setup example

How a project repo gives every AI tool the same instructions, skills, rules, agents, commands, hooks and MCP servers. The Claude Code files are the real ones; other tools read them directly, through a symlink, or (where the format differs) from a small real copy.

Copy the pieces you need into your project root. Symlinks survive `cp -R` and `git`.

## Every file and who reads it

### Instructions

| Path | Kind | Read by |
|------|------|---------|
| `CLAUDE.md` | real | Claude Code, Copilot CLI, VS Code |
| `AGENTS.md` | → `CLAUDE.md` | Codex, Cursor, Copilot CLI, VS Code |
| `GEMINI.md` | → `CLAUDE.md` | Gemini CLI, Copilot CLI |
| `.claude/rules/testing.md` | real, path-scoped | Claude Code (`paths:`), VS Code |
| `.cursor/rules` | → `.claude/rules` | Cursor (`globs:`); unverified that Cursor loads `.md` rules this way |

**Duplicates.** Copilot CLI reads `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`, so with these symlinks it may load the same text three times. To avoid that, drop the symlinks:

- In Codex, set `project_doc_fallback_filenames = ["CLAUDE.md"]`.
- In Gemini CLI, set `"context": {"fileName": ["CLAUDE.md"]}`.

### Skills, agents and commands

| Path | Kind | Read by |
|------|------|---------|
| `.claude/skills/run-tests/` | real | Claude Code, Copilot CLI, VS Code, Cursor |
| `.agents/skills` | → `.claude/skills` | Codex, Gemini CLI, Copilot CLI |
| `.claude/agents/test-writer.md` | real | Claude Code, Copilot CLI, VS Code, Cursor |
| `.codex/agents/test-writer.toml` | real copy (TOML) | Codex |
| `.claude/commands/fix-issue.md` | real | Claude Code, Copilot CLI |
| `.cursor/commands` | → `.claude/commands` | Cursor (unverified) |

New slash commands are better written as skills with `disable-model-invocation: true`, because every tool reads skills. `commands/` is the older format.

### Hooks

| Path | Kind | Read by |
|------|------|---------|
| `.claude/settings.json` → `hooks` | real | Claude Code; Cursor maps Claude's events and tool names; VS Code's Copilot harness |
| `.github/copilot/settings.json` | → `.claude/settings.json` | Copilot CLI: inline `hooks`, plus marketplace settings |
| `.codex/hooks.json` | real copy | Codex (after you trust the project) |
| `.claude/hooks/no-publish.mjs` | real | the script all of them run |

The hook blocks `npm`/`yarn`/`pnpm publish`. It uses the `Bash` matcher because every tool reports shell commands as `Bash` to Claude-format hooks; Cursor maps it to `Shell`. The command finds the script with `${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}`, so it works in tools that don't set `CLAUDE_PROJECT_DIR`. `node scripts/check.mjs` checks that `.codex/hooks.json` matches the `hooks` block in `.claude/settings.json`.

### MCP servers

| Path | Kind | Read by |
|------|------|---------|
| `.mcp.json` | real | Claude Code, Copilot CLI, VS Code (Copilot harness) |
| `.cursor/mcp.json` | → `.mcp.json` | Cursor |
| `.gemini/settings.json` | real copy | Gemini CLI (`mcpServers` has the same shape; the file also holds other Gemini settings, so it isn't a symlink) |
| `.codex/config.toml` | real copy (TOML) | Codex (after you trust the project) |

### Plugins

`.claude/settings.json` also recommends this marketplace and turns on `commit-craft` for everyone who opens the project. Claude Code reads `extraKnownMarketplaces` and `enabledPlugins` there, VS Code reads them from either settings file, and Copilot reads them from `.github/copilot/settings.json`.
