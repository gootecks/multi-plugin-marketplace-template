# Hooks

A hook runs a command when something happens in the agent: a session starts, the user sends a prompt, a tool is about to run. It gets a JSON payload on stdin and can block the action, add context, or do nothing.

**Every event in every tool**, with its equivalent elsewhere, is in [events.md](../../plugins/kitchen-sink/skills/explain-hook-event/references/events.md). This page covers files and contracts.

## The shared contract

Exit code 2 with a reason on stderr blocks the action in Claude Code, Codex, Copilot (for `preToolUse` and `permissionRequest`) and Cursor. Build hooks on that, and exit 0 for everything else. The JSON outputs differ per tool:

| | Claude Code | Codex | Copilot CLI / VS Code | Cursor |
|---|---|---|---|---|
| Hooks file format | `{"hooks": {"PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "…", "timeout": 10}]}]}}` | same as Claude | `{"version": 1, "hooks": {"preToolUse": [{"type": "command", "bash": "…", "powershell": "…", "timeoutSec": 10}]}}` | `{"version": 1, "hooks": {"beforeShellExecution": [{"command": "…", "matcher": "git"}]}}` |
| Shell command in the payload | `tool_input.command` | `tool_input.command` (`tool_name` is `Bash`) | camelCase events: `toolArgs` (a JSON string) → `.command`. PascalCase aliases: `tool_input.command` | `command` (`beforeShellExecution`), `tool_input.command` (`preToolUse`) |
| Deny as JSON | `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "…"}}` | same, or `{"decision": "block", "reason": "…"}` | `{"permissionDecision": "deny", "permissionDecisionReason": "…"}` | `{"permission": "deny", "user_message": "…", "agent_message": "…"}` |
| No opinion | print nothing | print nothing | print `{}` | print `{}`: empty or invalid output **blocks** permission hooks |
| Non-zero exit other than 2 | not a block | not a block | logged and skipped, except `preToolUse`, which fails closed | lets the action proceed unless `failClosed: true` |
| Plugin root | `${CLAUDE_PLUGIN_ROOT}` (expanded, and set in the environment) | `${PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_ROOT}` | relative `./` paths from the plugin root | `${CURSOR_PLUGIN_ROOT}`; the working directory is the plugin root, except for `stop` and `subagentStop` |

## Where hooks live

| Tool | Plugin | Project |
|------|--------|---------|
| Claude Code | `hooks/hooks.json` | `.claude/settings.json` → `hooks` |
| Codex | `hooks/hooks.json`, or the `hooks` path in `.codex-plugin/plugin.json` | `.codex/hooks.json`, or `[hooks]` in `.codex/config.toml` |
| Copilot CLI | `hooks/hooks.json` (PascalCase aliases) or the `hooks` path in its manifest | `.github/hooks/*.json`, inline `hooks` in `.github/copilot/settings.json` |
| VS Code | plugin `hooks` | Copilot harness: `.github/hooks/*.json`, `.claude/settings.json`. Local harness: `chat.hookFilesLocations`, and Claude hooks only with `chat.useClaudeHooks` (off by default) |
| Cursor | the `hooks` path in `.cursor-plugin/plugin.json` | `.cursor/hooks.json`; also `.claude/settings.json` (third-party configs, on by default) |
| Gemini CLI | extension `hooks/hooks.json` (Claude's nested shape, Gemini event names, timeouts in milliseconds) | `.gemini/settings.json` → `hooks` |

## Per-tool details that bite

- **Claude Code**
  - Exit 2 ignores any JSON on stdout.
  - Matchers made of letters, digits, `_`, `-`, spaces, commas and `|` are exact lists; anything else is an unanchored regex.
  - Tool events also take an `if` field in permission-rule syntax (`"Bash(git *)"`).
  - A `WorktreeCreate` hook *replaces* worktree creation and must print the new path.
- **Codex**
  - Users must review and trust plugin hooks in `/hooks` before they run.
  - Project hooks load only in a trusted project.
  - Plugins with hooks can't be listed in OpenAI's public directory.
  - `permissionDecision: "ask"` and `continue: false` aren't supported yet.
- **Copilot CLI**
  - The *configured name* picks the payload format: camelCase events get camelCase fields; PascalCase aliases get Claude-style snake_case fields and Claude tool names.
  - Only a subset of events has aliases: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `SessionStart`, `SessionEnd`, `Stop`, `SubagentStop`, `PreCompact`, `PermissionRequest` and `ErrorOccurred`.
  - Version 1.0.18 doesn't load `userPromptTransformed`.
- **Cursor**
  - Hooks run from the plugin's install folder, except `stop` and `subagentStop`, which run from the workspace root.
  - Running Claude hooks from `.claude/settings.json`, Cursor maps `PreToolUse`→`preToolUse`, `UserPromptSubmit`→`beforeSubmitPrompt`, `Stop`→`stop`, and the tool names `Bash`→`Shell` and `Edit`→`Write`.
  - It doesn't support `Notification`, `PermissionRequest` or the `Glob` tool.
- **VS Code**: its docs warn that sharing a file location with Claude "does not establish runtime compatibility".

## Examples in this repo

| Example | Shows |
|---------|-------|
| [`commit-craft/hooks/guard-force-push.mjs`](../../plugins/commit-craft/hooks/guard-force-push.mjs) | one blocking script for every tool; reads the command from each payload shape |
| [`commit-craft/hooks/hooks.json`](../../plugins/commit-craft/hooks/hooks.json) and [`cursor-hooks.json`](../../plugins/commit-craft/hooks/cursor-hooks.json) | the same hook wired for Claude Code, Codex and Copilot, and separately for Cursor |
| [`kitchen-sink/hooks/`](../../plugins/kitchen-sink/hooks) | every event for each tool in its native file, plus [`on-event.mjs`](../../plugins/kitchen-sink/hooks/on-event.mjs), which shows each tool's session-start context format |
| [`project-setup/.claude/hooks/no-publish.mjs`](../../examples/project-setup/.claude/hooks/no-publish.mjs) | a project hook in `.claude/settings.json`, copied to `.codex/hooks.json` |
