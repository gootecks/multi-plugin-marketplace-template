# Claude Code

The source-of-truth format for this repo. Sources: [plugins reference](https://code.claude.com/docs/en/plugins-reference), [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference), [loading and caching](https://code.claude.com/docs/en/plugins/loading), [CLI reference](https://code.claude.com/docs/en/plugins/cli-reference), [hooks](https://code.claude.com/docs/en/hooks). Checked 2026-11-14 with Claude Code 2.1.289.

## Install from this repo

```
/plugin marketplace add CarterCole/example-ai-marketplace
/plugin install commit-craft@example-ai-marketplace
```

Or `claude plugin marketplace add …` and `claude plugin install … [-s user|project|local]` from a shell. `--scope project` writes the plugin into `.claude/settings.json` for the whole team.

## Plugin layout

Only `.claude-plugin/plugin.json` lives inside `.claude-plugin/`; everything else sits at the plugin root:

| Path | Component |
|------|-----------|
| `skills/<name>/SKILL.md` | skills (a root `SKILL.md` with no `skills` key loads as one skill) |
| `commands/*.md` | commands; "Prefer `skills/` for new plugins" |
| `agents/*.md` | agents |
| `hooks/hooks.json` | hooks (needs the top-level `"hooks"` wrapper) |
| `.mcp.json` | MCP servers |
| `.lsp.json` | LSP servers |
| `output-styles/`, `themes/`, `monitors/monitors.json`, `workflows/`, `bin/` | see [vendor-specific components](../components/vendor-specific.md) |

A `CLAUDE.md` at the plugin root is not loaded, and the validator warns about it.

## plugin.json

- **Required:** only `name`. Kebab-case, with no spaces, `@`, `:` or slashes.
- **Common fields:** `version`, `description`, `author` (`name`, optional `email` and `url`), `homepage` (must parse as a URL), `repository`, `license` (SPDX), `keywords` and `displayName`.
- **Also accepted:** `$schema`, `metadata`, `defaultEnabled`, `dependencies`, `userConfig`, and component paths.
- **Unknown top-level keys** are stripped with a validator warning.

Component paths start with `./` and must resolve inside the plugin. How a path combines with the default folder depends on the field:

| Field | Effect of setting it |
|-------|----------------------|
| `skills` | **adds** to `skills/` |
| `commands`, `agents`, `outputStyles`, `workflows` | **replace** the default folder; list the default too to keep it, e.g. `["./commands/", "./extras/"]` |
| `hooks`, `mcpServers`, `lspServers` | **merge** with the default file; a later server with the same name wins |

## Variables

| Variable | Value |
|----------|-------|
| `${CLAUDE_PLUGIN_ROOT}` | the installed copy's absolute path; changes on every update, so don't keep state there |
| `${CLAUDE_PLUGIN_DATA}` | `~/.claude/plugins/data/<id>/`, kept across updates |
| `${CLAUDE_PROJECT_DIR}` | project root |
| `${user_config.KEY}` | a `userConfig` value |

They're expanded in hook commands, MCP and LSP `command`/`args`/`env`, and skill, command and agent bodies. They are not set inside the Bash tool.

## Caching, symlinks and updates

- **Caching:** Installed plugins are copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.
  - Plugins loaded with `--plugin-dir`, and relative-path plugins in a marketplace added from a local folder, load in place.
  - Files outside the plugin aren't copied.
  - Symlinks that lead outside the plugin are rejected ("path escapes plugin directory"), except links between plugins in the same marketplace.
- **Version:** taken from `plugin.json` first, then the marketplace entry. If neither has one, it comes from the source: the commit SHA (12 characters) for git sources, and `unknown` for a local folder outside git or for npm.
- **Updates:** detected when that version string changes.
- **Auto-update:** on for official marketplaces and off for others. Turn it on with `autoUpdate` in `extraKnownMarketplaces`.
- **In a session:** run `/reload-plugins` to apply changes.

## marketplace.json

- **Top level:**
  - `name` (required): letters, digits, `.`, `_` and `-`. Reserved names include `claude-plugins-official`, `anthropic-plugins`, `agent-skills` and names starting `claudeai-`.
  - `owner` (required)
  - `plugins` (required)
  - optional: `$schema`, `description`, `version`, `metadata.pluginRoot`, `renames`, `forceRemoveDeletedPlugins` and `allowCrossMarketplaceDependenciesOn`
- **Entries:**
  - `name` and `source` (both required)
  - `description`, `version` (`plugin.json` wins), `category`, `tags`, `displayName`, `dependencies`, `defaultEnabled`
  - `strict` (default `true`: entry components add to the manifest's. With `false` and no `plugin.json`, the entry *is* the manifest)
- **Sources:**

| Type | Keys |
|------|------|
| relative path | `"./plugins/x"`; no `..` |
| `github` | `repo`, `ref`, `sha` |
| `url` | `url`, `ref`, `sha` |
| `git-subdir` | `url`, `path`, `ref`, `sha` |
| `npm` | `package`, `version`, `registry` |
| `archive` | `url` (https), `sha256` |
| `command` | `command`, `timeout`, `mode` (`copy` or `link`) |

## Team setup

In a project's `.claude/settings.json`, `extraKnownMarketplaces` adds marketplaces and `enabledPlugins` (`"name@marketplace": true`) turns plugins on for everyone; see [`examples/project-setup`](../../examples/project-setup/.claude/settings.json). Project plugins load after the workspace trust prompt.

## Validate and release

- `claude plugin validate [--strict] [--json] <path>` checks a marketplace or plugin. `--strict` turns warnings into failures. Warnings include unknown fields, a non-kebab-case name, and a missing version, description or author.
- `claude plugin tag [path] [--push]` creates `<name>--v<version>` after checking that `plugin.json` and the marketplace entry agree.
- `claude plugin details <name>` lists what loaded and its token cost. Use it with `claude --plugin-dir <path>` for a plugin that isn't installed.
