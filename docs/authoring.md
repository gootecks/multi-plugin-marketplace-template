# Authoring plugins

## Add a plugin

1. Copy the closest example. `cp -R` keeps symlinks as symlinks.

   ```bash
   cp -R plugins/changelog-writer plugins/my-plugin
   ```

   Start from [`changelog-writer`](../plugins/changelog-writer) for skills only, [`commit-craft`](../plugins/commit-craft) for hooks shared by Claude, Codex and Copilot, or [`kitchen-sink`](../plugins/kitchen-sink) for tool-native hooks.
2. Set `name` in `.claude-plugin/plugin.json` to the folder name, and update `description`, `version` and `keywords`. Rename the skill folder; a skill's folder name must equal the `name` in its `SKILL.md`.
3. Edit `README.md`. Keep `LICENSE`: only the plugin folder is copied on install, so the repo's license doesn't travel with it.
4. Add an entry to `.claude-plugin/marketplace.json` with the same `name` and `version`, and a `source` starting with `./` (Codex requires it).
5. Run the check, then test locally (below).

   ```bash
   node scripts/check.mjs
   ```

## Rules

- **Write in Claude Code's format.** Never add a root `plugin.json` or `.plugin/plugin.json`: Copilot and Codex read those before `.claude-plugin/plugin.json`. See [how it works](how-it-works.md#lookup-order-who-reads-what-first).
- **Prefer skills over commands.** Every tool reads `skills/`; not every tool reads `commands/`. For a slash command, write a skill with `disable-model-invocation: true` and an `argument-hint` ([example](../plugins/kitchen-sink/skills/show-events/SKILL.md)). If you keep `commands/`, list `"commands": "./commands/"` in the manifest for Copilot.
- **Vendor manifests match Claude's.** A real `.cursor-plugin/`, `.github/plugin/` or `.codex-plugin/` manifest keeps the same `name`, `version`, `description` and `author`. Only its component paths differ.
- **Hooks block with exit code 2 and a reason on stderr.** It is the one contract Claude Code, Codex, Copilot and Cursor share. Exit 0 on anything unexpected so a bug never stops the agent. See [hooks](components/hooks.md).
- **Use plugin-root variables, not relative paths, in Claude-format files.** `${CLAUDE_PLUGIN_ROOT}` works in Claude Code, Codex (also `${PLUGIN_ROOT}`), Copilot and Cursor's MCP config. Cursor and Copilot hooks run with the plugin root as the working directory, so `./` works there.
- **Names are permanent.** Users have the plugin installed under its `name`. To relabel it, set `displayName`. To rename it anyway, add `"renames": {"old": "new"}` at the top of `marketplace.json` so Claude Code migrates existing installs.
- **Keep secrets out.** Hooks and MCP servers run as the user. Don't log prompt or command text; read tokens from the environment.

## Versions and releases

- Bump `version` in `plugin.json` **and** the marketplace entry. Claude Code uses the manifest's version first; a pinned version keeps users on their cached copy until the string changes. Without any version, Claude Code uses the commit SHA, so every commit counts as an update.
- Claude Code auto-updates only official marketplaces by default. Users can turn it on for this one with `autoUpdate` in `extraKnownMarketplaces`.
- Tag releases with `claude plugin tag plugins/<name>`. It creates `<name>--v<version>`, checks that `plugin.json` and the marketplace entry agree, and refuses on a dirty tree. Add `--push` to push the tag.

## Test locally

| Tool | How |
|------|-----|
| Claude Code | `claude --plugin-dir plugins/<name>` loads it for one session. `claude --plugin-dir plugins/<name> plugin details <name>` lists what loaded. `claude plugin validate --strict plugins/<name>` |
| Copilot CLI | `COPILOT_HOME=$(mktemp -d) copilot plugin install ./plugins/<name>` keeps your real config clean. `copilot --agent nope -p ok --log-level debug --log-dir <dir>` lists loaded agents without calling a model, and the log says `Loaded N hook(s)` |
| VS Code | **Chat: Install Plugin from Source** with the local path |
| Codex | `codex plugin marketplace add ./` then `codex plugin add <name>@example-ai-marketplace`; review hooks in `/hooks` |
| Cursor | symlink or copy the plugin to `~/.cursor/plugins/local/<name>` and run **Reload Window** |
| Gemini CLI | `gemini skills link plugins/<name>/skills/<skill>` |

With [`kitchen-sink`](../plugins/kitchen-sink) installed, every hook event is logged to `~/.kitchen-sink/events.jsonl`; run `/show-events` to see what fired.

## What the check covers

`node scripts/check.mjs` (add `--no-cli` to skip the Claude CLI) fails on:

- broken, absolute or out-of-repo symlinks, and JSON that doesn't parse
- plugin folders missing from the marketplace, or marketplace entries with no folder
- name or version differences between the marketplace and `plugin.json`
- a manifest that would shadow Claude's, and vendor manifests whose metadata differs from Claude's or whose paths don't exist
- a plugin with hooks whose Cursor manifest is still a symlink
- hook or MCP files that reference scripts that don't exist
- skills that break the [Agent Skills](https://agentskills.io/specification) naming rules
- plugins without `README.md` or `LICENSE`
- project copies that drifted: `.codex/hooks.json` against `.claude/settings.json` hooks, and `.gemini/settings.json` against `.mcp.json` MCP servers
- broken relative links in Markdown

It then runs `claude plugin validate --strict` on the marketplace and every plugin. CI runs it on every push and pull request.
