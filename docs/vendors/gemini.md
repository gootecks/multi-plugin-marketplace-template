# Gemini CLI

This marketplace doesn't ship Gemini extensions; Gemini users install individual skills. Sources: [extensions reference](https://geminicli.com/docs/extensions/reference), [releasing extensions](https://geminicli.com/docs/extensions/releasing), [skills](https://geminicli.com/docs/cli/skills), [hooks](https://geminicli.com/docs/hooks/), [custom commands](https://geminicli.com/docs/cli/custom-commands/), [settings](https://geminicli.com/docs/cli/settings/), [MCP servers](https://geminicli.com/docs/tools/mcp-server/), and the [gemini-cli](https://github.com/google-gemini/gemini-cli) source. Checked 2026-11-14 with Gemini CLI 0.36.0.

> On 2026-06-18 Google replaced Gemini CLI with **Antigravity CLI** for unpaid and Google One users. `agy plugin import gemini` converts extensions to Antigravity plugins ([migration guide](https://antigravity.google/docs/cli/gcli-migration)).

## Install skills from this repo

```bash
gemini skills install https://github.com/CarterCole/example-ai-marketplace --path plugins/commit-craft/skills/conventional-commits
```

`--scope workspace` installs into the project instead of the user folder. `gemini skills link <path>` links a local checkout so edits show up immediately.

## Why there are no Gemini extensions here

- **The manifest must sit at the repo root.** `gemini extensions install` takes `owner/repo` or a git URL with no subfolder option, so one repo holds one extension.
- **Symlinks break on install.** The installer clones to a temporary folder and copies it with `fs.cp`, which rewrites symlinks as absolute paths into that folder. The folder is then deleted, leaving the links dangling.
- **The hooks file collides with Claude's.** Extensions keep hooks in `hooks/hooks.json`, the same path as Claude Code plugins, in Claude's nested shape but with Gemini's event names.

To publish a plugin as a Gemini extension, give it its own repo, or attach a release archive with the extension at its root. The [extension gallery](https://geminicli.com/extensions/browse) indexes public GitHub repos tagged `gemini-cli-extension` with the manifest at the root, crawled daily.

## Extension format

`gemini-extension.json` at the extension root:

- `name`: lowercase with dashes; should equal the folder name
- `version` and `description`
- `mcpServers` (no `trust` key)
- `contextFileName` (default `GEMINI.md`)
- `excludeTools`
- `settings`: a list of `{name, description, envVar, sensitive}`
- `themes`, `plan` and `migratedTo`

Variables: `${extensionPath}`, `${workspacePath}` and `${/}`.

| Component | Location |
|-----------|----------|
| Commands | `commands/*.toml` with `prompt` and `description`; `{{args}}`, `!{shell}`, `@{file}` |
| Skills | `skills/<name>/SKILL.md` |
| Agents | `agents/*.md` (preview) |
| Hooks | `hooks/hooks.json`. Events: `BeforeTool`, `AfterTool`, `BeforeAgent`, `AfterAgent`, `BeforeModel`, `AfterModel`, `BeforeToolSelection`, `SessionStart`, `SessionEnd`, `Notification`, `PreCompress`. Timeouts in milliseconds |
| Policies | `policies/*.toml` |

## Project files

| Purpose | File |
|---------|------|
| Instructions | `GEMINI.md`, or the names in `"context": {"fileName": [...]}` |
| Skills | `.agents/skills/`, `.gemini/skills/` |
| Commands | `.gemini/commands/*.toml`; subfolders namespace them |
| MCP | `.gemini/settings.json` → `mcpServers` (`command`, `args`, `env`, `cwd`, `timeout`, `trust`, `includeTools`, `excludeTools`; remote: `httpUrl` or `url`, `headers`) |
| Hooks | `.gemini/settings.json` → `hooks`; project hooks are fingerprinted, and Gemini warns again when they change |
