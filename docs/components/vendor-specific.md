# Components only some tools have

These work in one or two tools and are ignored elsewhere, so adding them doesn't break other tools. The check script doesn't need to know about them.

## Claude Code

| Component | Where | Notes |
|-----------|-------|-------|
| LSP servers | `.lsp.json` or `lspServers` in `plugin.json` | also read by Copilot CLI (`lspServers`). Each entry needs `command` and `extensionToLanguage` |
| Output styles | `output-styles/*.md` | change how Claude answers; [example](../../plugins/kitchen-sink/output-styles/field-notes.md) |
| `bin/` | executables added to the Bash tool's `PATH` while the plugin is on | claude.ai and Cowork won't install a plugin that has one, so leave it out of plugins meant for those |
| `userConfig` | `plugin.json` | options the user fills in on install; read as `${user_config.KEY}` in MCP, LSP and skill text, and as `CLAUDE_PLUGIN_OPTION_<KEY>` in hooks |
| `dependencies` | `plugin.json` | other plugins installed alongside, as `"name"`, `"name@marketplace"` or `{name, marketplace, version}` |
| `defaultEnabled` | `plugin.json` or marketplace entry | `false` installs the plugin turned off |
| `experimental.themes`, `experimental.monitors` | `plugin.json` | color themes, and background monitors from `monitors/monitors.json` |
| `${CLAUDE_PLUGIN_DATA}` | any config | a folder kept across updates, deleted on uninstall unless `--keep-data` |

LSP example (`.lsp.json` at the plugin root). It needs `typescript-language-server` installed, which is why no plugin here ships one:

```json
{
  "typescript": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "extensionToLanguage": { ".ts": "typescript", ".tsx": "typescriptreact" }
  }
}
```

## Codex

| Component | Where | Notes |
|-----------|-------|-------|
| `interface` | `.codex-plugin/plugin.json` | display name, descriptions, category, logo, brand color, up to 3 default prompts. Required for OpenAI's directory |
| Apps | `.app.json` or `apps` | ChatGPT app connectors |
| `policy` | marketplace entry | `installation`: `AVAILABLE`, `INSTALLED_BY_DEFAULT` or `NOT_AVAILABLE`; `authentication`: `ON_INSTALL` or `ON_USE` |
| `agents/openai.yaml` | inside a skill folder | interface, implicit-invocation policy, dependencies |

## Cursor

| Component | Where | Notes |
|-----------|-------|-------|
| Rules | `rules/*.mdc` | see [instructions](instructions.md#scoped-rules) |
| `variables` | `.cursor-plugin/plugin.json` | a JSON Schema of values filled in on install, used as `${VAR}` in MCP config |
| `logo` | manifest | a relative path becomes a `raw.githubusercontent.com` URL pinned to the commit |

## Copilot

| Component | Where | Notes |
|-----------|-------|-------|
| `lspServers` | manifest | same idea as Claude Code's |
| Prompt-type hooks | `sessionStart` only | `"type": "prompt"` runs a prompt instead of a command, CLI and new interactive sessions only |
| `extensions` | manifest | Copilot extensions |
