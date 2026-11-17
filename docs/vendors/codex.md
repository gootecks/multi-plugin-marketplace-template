# OpenAI Codex

Codex reads Claude Code marketplaces and manifests as a fallback. Sources: [build plugins](https://developers.openai.com/plugins/build/plugins), [submission](https://developers.openai.com/plugins/deploy/submission), [hooks](https://learn.chatgpt.com/docs/hooks), [CLI commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli), [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills](https://learn.chatgpt.com/docs/build-skills), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), and the [openai/codex](https://github.com/openai/codex) source (`codex-rs/`). Checked 2026-11-14. **Not tested here**: the local Codex install is missing its native binary.

## Install from this repo

```bash
codex plugin marketplace add CarterCole/example-ai-marketplace
```

```bash
codex plugin add commit-craft@example-ai-marketplace
```

`marketplace add` also takes `--ref`, `--sparse PATH`, `owner/repo@ref`, git URLs and local folders. In the terminal UI, `/plugins` opens the browser. To turn a plugin on for one repo, add `[plugins."commit-craft@example-ai-marketplace"] enabled = true` to `.codex/config.toml`. The IDE extension doesn't support plugins.

## Lookup order

| File | Order (first found wins) |
|------|--------------------------|
| Marketplace | `.agents/plugins/marketplace.json`, `api_marketplace.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json` |
| Plugin manifest | root `plugin.json` (only with the Agent Plugins `$schema`), `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json` |

If `extensions["com.openai"]` exists in a root Agent Plugins manifest, the `.codex-plugin` overlay is ignored, not merged.

## Two manifest formats

- **Agent Plugins** (portable):
  - a root `plugin.json` with `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`
  - skills always come from `skills/` and MCP from `mcp.json`, which needs an explicit `type`
  - Codex-only settings go under `extensions["com.openai"]`
  - Codex accepts schema 1.0.0 only
- **Compatibility** (`.codex-plugin/plugin.json`):
  - `name`, `version`, `description`, `author.name` and `interface` are required for OpenAI's directory
  - component paths: `skills`, `mcpServers` (a path or an inline object), `apps`, `hooks`
  - defaults: `skills/`, `hooks/hooks.json`, `.mcp.json`, `.app.json`
  - every path starts with `./` and stays inside the plugin

## Marketplace entries

`.agents/plugins/marketplace.json` has a `name`, an `interface.displayName`, and `plugins[]`. Each entry has:

- `name`
- `source`: `"./path"`, `{source: "local", path}`, `{source: "url", url, path, ref, sha}`, `{source: "git-subdir", url, path, ref, sha}` or `{source: "npm", package, version, registry}`
- `policy`: `installation` and `authentication`
- `category`

`owner` isn't parsed. Local paths need `./` and resolve against the marketplace root. Entries that don't resolve are skipped. This repo doesn't need the file, because Codex falls through to Claude's.

## Components

| Component | Support |
|-----------|---------|
| Skills | `SKILL.md` with `name` and `description`; optional `agents/openai.yaml` |
| Commands | plugin `commands/*.md` with a `description` and at most 4 KB are turned into skills at install (from the source; not in the docs). Custom prompts are deprecated |
| Agents | **not in plugins**. Project agents are TOML in `.codex/agents/*.toml` with `name`, `description`, `developer_instructions` |
| Hooks | Claude's file shape. Events: `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `SubagentStart`, `SubagentStop`, `Stop`, `PreModelRequest`, `PostModelRequest`, `Interrupt`. The shell tool reports `tool_name: "Bash"`, with the command as one string at `tool_input.command`. Exit 2, Claude's `permissionDecision: "deny"` JSON, or `{"decision": "block"}` all block |
| MCP | `.mcp.json` with `mcpServers`; no `${…}` expansion found; a relative `cwd` resolves against the plugin root |
| Rules | none |

The last three Codex hook events aren't valid in Claude Code (`claude plugin validate --strict` rejects them), which is why [kitchen-sink](../../plugins/kitchen-sink) has its own [`.codex-plugin/plugin.json`](../../plugins/kitchen-sink/.codex-plugin/plugin.json) and `codex-hooks.json`.

## Variables and trust

- **Variables:** hooks get `PLUGIN_ROOT` and `PLUGIN_DATA`, plus `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA`.
- **Hook review:** users must review and trust plugin hooks in `/hooks` before they run. Plugins with hooks can't be listed in OpenAI's public directory.
- **Project trust:** project config (`.codex/config.toml`, `.codex/hooks.json`) loads only after the user trusts the project, through `projects.<path>.trust_level` in `~/.codex/config.toml`.

## Project files

| Purpose | File |
|---------|------|
| Instructions | `AGENTS.override.md`, `AGENTS.md`, then `project_doc_fallback_filenames`; global `~/.codex/AGENTS.md`; 32 KiB default limit |
| Skills | `.agents/skills/` from the working directory up to the repo root |
| Agents | `.codex/agents/*.toml` |
| Hooks | `.codex/hooks.json`, or `[hooks]` in `.codex/config.toml` (both merge, with a warning) |
| MCP | `.codex/config.toml` → `[mcp_servers.<name>]` with `command`, `args`, `env`, `cwd`, or `url`, `bearer_token_env_var`, `http_headers` |

## Validation

There's no `codex plugin validate`. Validation happens when you upload a ZIP to OpenAI's submission portal. The JSON schemas are at agent-plugins.org/schemas/1.0.0.
