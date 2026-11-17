# Official marketplace conventions

What Anthropic's [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) repo does, read at commit `b5b01ac` on 2026-11-14, and what this repo takes from it.

## Status of that repo

- Third-party plugins are now submitted at [claude.ai/directory/manage](https://claude.ai/directory/manage) and served across Claude products from there. Pull requests to the repo are not monitored.
- `.claude-plugin/marketplace.json` is being reduced to Anthropic's own plugins. At this commit it still lists 317.
- `plugins/` holds Anthropic's plugins; `external_plugins/` holds third-party plugins added before submissions moved, plus Anthropic's channel plugins.
- `plugins/example-plugin` is the reference implementation.

To get a plugin from this repo into Claude's directory, submit it at claude.ai/directory/manage. This marketplace keeps working on its own either way.

## Marketplace file

Top-level keys: `$schema` (`https://anthropic.com/claude-code/marketplace.schema.json`; ignored at load time), `name`, `description`, `owner`, `plugins` and `renames`.

How the 317 entries are written:

| Field | Entries using it | Notes |
|-------|------------------|-------|
| `name`, `description`, `source` | 317 | |
| `category` | 303 | `development` 123, `productivity` 70, `database` 39, `monitoring` 22, `security` 18, `deployment` 9, `design` 9, `automation` 3, `learning` 3, `location` 2, `math` 2, `testing` 2, `migration` 1 |
| `homepage` | 301 | |
| `author` | 235 | |
| `displayName` | 16 | label shown in the UI; lets the immutable `name` stay put |
| `strict` | 14 | `false` for skill bundles with no `plugin.json` |
| `version` | 14 | most entries let the commit SHA be the version |
| `lspServers` | 12 | LSP servers declared in the entry |
| `skills`, `tags` | 3 each | |

Source types in use: `url` 163, `git-subdir` 98, relative path 55, `command` 1 (Xcode's `xcrun agent plugin path`). Every remote source is pinned with a full commit `sha`, and a nightly workflow bumps the pins.

## Conventions

- **Plugin names are immutable.** Change `displayName` to relabel. If a rename is unavoidable, add it to the top-level `renames` map so existing installs migrate.
- **Skill bundles.** A repo that ships `SKILL.md` folders without a `plugin.json` can be listed with `"strict": false` and a `skills` array of paths relative to `source.path`.
- **Commands are legacy.** The example plugin keeps `commands/example-command.md` only to show the old layout, and recommends `skills/<name>/SKILL.md` for user-invoked slash commands; both load the same way.
- **Every plugin has its own `README.md` and `LICENSE`.** Their CI requires a LICENSE in every plugin folder, Apache 2.0 for Anthropic's own.
- **Standard layout:** `.claude-plugin/plugin.json`, `.mcp.json`, `commands/`, `agents/`, `skills/`, `README.md`.

## Their CI

| Workflow | Checks |
|----------|--------|
| `validate-plugins.yml` | runs `claude plugin validate` on every plugin folder twice: once alone, once inside a throwaway marketplace with the official name, so reserved names pass but other bad names fail. Also checks that folder names equal `plugin.json` names, that frontmatter parses, and that agents, skills and commands have `name` and `description` |
| `validate-licenses.yml` | every plugin has a LICENSE |
| `scan-plugins.yml` | a Claude policy review of changed external entries, cached per plugin and SHA |
| `check-mcp-urls.yml`, `bump-plugin-shas.yml`, `revert-failed-bumps.yml`, `close-external-prs.yml` | MCP URL health, nightly SHA bumps, dropping bumps that fail the scan, and closing outside pull requests |

## What this repo copies

| Convention | Here |
|------------|------|
| `README.md` and `LICENSE` in every plugin | required by `scripts/check.mjs` |
| folder name equals `plugin.json` name | required |
| `claude plugin validate` in CI | `--strict`, on the marketplace and every plugin |
| skills preferred over commands | the [authoring rules](authoring.md#rules) say so; existing `commands/` stay as examples of the legacy format |
| `displayName` and `renames` for relabeling and renaming | documented in [authoring](authoring.md#rules) |

Not copied: Apache 2.0 (this repo is MIT), the `$schema` key (Claude Code ignores it, and not every other tool's schema allows it), SHA pinning (all plugins here are relative paths), and the policy scan.
