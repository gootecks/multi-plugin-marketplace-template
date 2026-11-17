# Instructions and rules

Instructions are always-on text the agent reads at the start of a session. Rules are instructions scoped to files that match a pattern.

## Project instructions

| Tool | Reads |
|------|-------|
| Claude Code | `CLAUDE.md`, `.claude/CLAUDE.md`, and `CLAUDE.md` files in subfolders as it works in them |
| Copilot CLI | `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md` |
| VS Code | `.github/copilot-instructions.md`, `AGENTS.md` (`chat.useAgentsMdFile`, on), `CLAUDE.md` (`chat.useClaudeMdFile`, on); nested `AGENTS.md` only with `chat.useNestedAgentsMdFiles` |
| Codex | per folder: `AGENTS.override.md`, then `AGENTS.md`, then any `project_doc_fallback_filenames`; 32 KiB limit by default |
| Cursor | `AGENTS.md`, `.cursor/rules/` |
| Gemini CLI | `GEMINI.md`, or the names in `context.fileName` |

The usual way to keep one copy: write `CLAUDE.md`, then symlink `AGENTS.md → CLAUDE.md` and `GEMINI.md → CLAUDE.md` ([example](../../examples/project-setup)).

**Duplicates.** Copilot CLI and VS Code read more than one of these names, so the same text can load twice or three times. To avoid that without symlinks:

- In Codex, set `project_doc_fallback_filenames = ["CLAUDE.md"]`.
- In Gemini CLI, set `"context": {"fileName": ["CLAUDE.md"]}`.
- In VS Code, turn off `chat.useAgentsMdFile`.

## Scoped rules

| Tool | Location | Scoping field |
|------|----------|---------------|
| Claude Code | `.claude/rules/*.md` | `paths:` (list of globs) |
| VS Code | `.claude/rules`, `.github/instructions` (`chat.instructionsFilesLocations`) | `paths:` in `.claude/rules`; `applyTo:` (comma-separated globs) in `.instructions.md` |
| Copilot CLI | `.github/instructions/**/*.instructions.md` | `applyTo:` |
| Cursor | `.cursor/rules/*.mdc`, plugin `rules/` | `description`, `globs`, `alwaysApply` |

A rule file can carry both `paths:` and `globs:`, so one file in `.claude/rules/` serves Claude Code, VS Code and, through `.cursor/rules → .claude/rules`, Cursor ([example](../../examples/project-setup/.claude/rules/testing.md); the Cursor side is unverified).

## Instructions from a plugin

Plugins can't ship a `CLAUDE.md`: Claude Code doesn't load one at the plugin root, and `claude plugin validate` warns about it. Options:

| Want | Use |
|------|-----|
| Guidance the agent pulls in when relevant | a skill; every tool reads them |
| Text added to every session | a `SessionStart` hook that returns context ([`on-event.mjs`](../../plugins/kitchen-sink/hooks/on-event.mjs) shows the format for each tool) |
| A Cursor rule | `rules/*.mdc` in the plugin ([example](../../plugins/commit-craft/rules/commit-style.mdc)) |
