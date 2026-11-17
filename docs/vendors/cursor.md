# Cursor

Cursor's plugin and marketplace manifests have the same shape as Claude Code's, so they're symlinks here, except for plugins with hooks. Sources: [plugins reference](https://cursor.com/docs/reference/plugins), [plugins](https://cursor.com/docs/plugins), [hooks](https://cursor.com/docs/hooks), [third-party hooks](https://cursor.com/docs/reference/third-party-hooks), [skills](https://cursor.com/docs/skills), [subagents](https://cursor.com/docs/subagents), [CLI changelog](https://cursor.com/docs/cli/changelog), [cursor/plugin-template](https://github.com/cursor/plugin-template), [cursor/plugins](https://github.com/cursor/plugins). Checked 2026-11-14. **Not tested here**: Cursor isn't installed on the test machine.

## Install from this repo

- **CLI:** `/plugin marketplace add https://github.com/CarterCole/example-ai-marketplace`, or `agent plugin marketplace add <git-url> [--git-ref <ref>]` (with `list`, `update`, `remove`).
- **App:** Customize, then Install, then pick user or project scope.
- **Teams and Enterprise:** Dashboard, then Plugins & MCPs, then Import from Repo.
- **Local development:** put the plugin in `~/.cursor/plugins/local/<name>` and run **Reload Window**. Symlinks pointing outside that folder are skipped.
- **Public listing:** submit at cursor.com/marketplace/publish for manual review.

## Manifests

**`.cursor-plugin/plugin.json`**
- `name` (required): kebab-case; letters, digits, hyphens and periods.
- Optional: `description`, `version`, `author`, `homepage`, `repository`, `license`, `keywords` and `logo`.
- Component paths: `rules`, `agents`, `skills`, `commands`, `hooks`, `mcpServers` and `variables`.
- Setting a component path **replaces** discovery of that folder.
- Defaults: `skills/`, `rules/`, `agents/`, `commands/`, `hooks/hooks.json`, `mcp.json` (no dot), or a root `SKILL.md`.
- Paths can't use `..` or be absolute.

**`.cursor-plugin/marketplace.json`**
- `name`, `owner` and `plugins` (required); optional `metadata` (`description`, `version`, `pluginRoot`). The file is at most 10 MB.
- Entries: `name` and `source` (a path string, or an object with `path`), plus the same metadata and component fields as a manifest, and `category` and `tags`.
- Cursor merges each entry with `<source>/.cursor-plugin/plugin.json`; the plugin's manifest wins.
- No `policy` or `interface`. The official schema in cursor/plugins also allows remote URLs and `minClientVersions`.

## Components

| Component | Format |
|-----------|--------|
| Skills | `name` (must equal the folder) and `description`; optional `paths`, `disable-model-invocation`, `icon`, `color`, `metadata` |
| Rules | `.mdc` with `description`, `globs`, `alwaysApply` |
| Agents | `.md` with `name`, `description`; optional `model`, `readonly`, `is_background` |
| Commands | `.md`, `.mdc`, `.markdown` or `.txt`; optional `name`, `description` |
| Hooks | `{"version": 1, "hooks": {"<event>": [{"command", "matcher", "timeout"}]}}`; commands only in plugins |
| MCP | `mcp.json` with `mcpServers`; expands `${CURSOR_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_ROOT}` and `variables`; servers show as `plugin-<plugin>-<server>` |

## Hooks

- **Events:**
  - session: `sessionStart`, `sessionEnd`, `workspaceOpen`
  - prompt: `beforeSubmitPrompt`
  - tools: `preToolUse`, `postToolUse`, `postToolUseFailure`, `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`, `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`
  - Tab completion: `beforeTabFileRead`, `afterTabFileEdit`
  - agent: `subagentStart`, `subagentStop`, `preCompact`, `afterAgentResponse`, `afterAgentThought`, `stop`
- **Exit codes:** exit 2 blocks. Other non-zero exits let the action proceed unless `failClosed: true`.
- **Output:** permission hooks with invalid or empty JSON block, so print `{}` for "no opinion". Deny with `{"permission": "deny", "user_message", "agent_message"}`.
- **Session-start context:** returned as `additional_context`. `beforeSubmitPrompt` can't add context.
- **Environment:** hooks get `CURSOR_PLUGIN_ROOT`, `CURSOR_PROJECT_DIR` and `CLAUDE_PROJECT_DIR`, and run from the plugin folder, except `stop` and `subagentStop`, which run from the workspace root.

## Claude compatibility

With **Include Third-Party Plugins, Skills, and Other Configs** on (the default), Cursor loads `.claude/skills`, `.claude/agents`, and hooks from `.claude/settings.json` and `.claude/settings.local.json`.

- **Events:** Claude's names are mapped: `PreToolUse`→`preToolUse`, `PostToolUse`→`postToolUse`, `UserPromptSubmit`→`beforeSubmitPrompt`, `Stop`→`stop`, `SubagentStop`→`subagentStop`, `SessionStart`→`sessionStart`, `SessionEnd`→`sessionEnd`, `PreCompact`→`preCompact`. `Notification` and `PermissionRequest` aren't supported.
- **Tool names:** `Bash`→`Shell` and `Edit`→`Write`; `Glob` isn't supported.
- **Output:** `permissionDecision`→`permission`, `permissionDecisionReason`→`user_message`, `updatedInput`→`updated_input`.

The May 2026 CLI changelog says plugins imported from Claude Code appear alongside native ones. Whether a marketplace import reads `.claude-plugin/` directly is unconfirmed, so this repo ships `.cursor-plugin/` files.

## Validation

There's no built-in validate command. Use `node scripts/validate-template.mjs` from cursor/plugin-template, or `scripts/validate-plugins.mjs` with `schemas/{plugin,marketplace}.schema.json` from cursor/plugins.
