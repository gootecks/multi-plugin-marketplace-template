# Example AI Marketplace

One repo of AI agent plugins that installs into **Claude Code**, **GitHub Copilot** (CLI and VS Code), **OpenAI Codex** and **Cursor**. Skills also work in **Gemini CLI**.

**This is a template.** Install it to try the example plugins, or [copy it](#make-your-own-marketplace) to start a marketplace with your own.

Everything is written once, in Claude Code's plugin format:

- **Copilot and Codex** read Claude's files as they are.
- **Cursor** gets symlinks to them.
- **Small real copies** exist only where a tool's format differs, mostly hook files. A check script keeps those in sync.

See [how it works](docs/how-it-works.md).

## Plugins

| Plugin | What it is |
|--------|------------|
| [commit-craft](plugins/commit-craft) | Conventional Commits skill, `/commit`, a diff-reviewer agent, a hook that blocks force-pushes to `main`, a git MCP server |
| [changelog-writer](plugins/changelog-writer) | one skill that writes Keep a Changelog entries; the smallest plugin shape, and the one to copy |
| [kitchen-sink](plugins/kitchen-sink) | reference: one of every component, a logger on every hook event for every tool, and an MCP server shipped inside the plugin |

[`examples/project-setup`](examples/project-setup) shows the same approach for a project repo: instructions, rules, skills, agents, commands, hooks and MCP servers for every tool, from one set of Claude files.

## Install

Add the marketplace once, then install any plugin from it with `<plugin>@example-ai-marketplace`.

**Claude Code**

```
/plugin marketplace add CarterCole/example-ai-marketplace
/plugin install commit-craft@example-ai-marketplace
```

**Copilot CLI**

```bash
copilot plugin marketplace add CarterCole/example-ai-marketplace
```

```bash
copilot plugin install commit-craft@example-ai-marketplace
```

**VS Code**: set `"chat.plugins.enabled": true`, and add `CarterCole/example-ai-marketplace` to `chat.plugins.marketplaces`. Keep the two GitHub defaults, because setting the list replaces them. Then install from the Customizations editor's **Browse** page. See [Copilot](docs/vendors/copilot.md#install-from-this-repo) for details.

**Codex**

```bash
codex plugin marketplace add CarterCole/example-ai-marketplace
```

```bash
codex plugin add commit-craft@example-ai-marketplace
```

**Cursor**: `/plugin marketplace add https://github.com/CarterCole/example-ai-marketplace` in the Cursor CLI, or Dashboard → Plugins & MCPs → Import from Repo.

**Gemini CLI** (skills only):

```bash
gemini skills install https://github.com/CarterCole/example-ai-marketplace --path plugins/commit-craft/skills/conventional-commits
```

## What each tool reads

| | Claude Code | Copilot / VS Code | Codex | Cursor |
|---|:-:|:-:|:-:|:-:|
| `.claude-plugin/marketplace.json` | ✓ | ✓ | ✓ | symlink |
| `.claude-plugin/plugin.json` | ✓ | ✓ | ✓ | symlink, or a real copy if the plugin has hooks |
| Skills | ✓ | ✓ | ✓ | ✓ |
| Commands | ✓ | ✓ | as skills | ✓ |
| Agents | ✓ | ✓ | ✗ | ✓ |
| Hooks | ✓ | ✓ | ✓ | own file |
| MCP | ✓ | ✓ | ✓ | ✓ |

The full matrix, project-level files, and what was actually tested are in [compatibility](docs/compatibility.md).

## Layout

```
.claude-plugin/marketplace.json     the marketplace (source of truth)
.cursor-plugin/marketplace.json  →  symlink to it
plugins/<name>/
  .claude-plugin/plugin.json        source of truth
  .cursor-plugin/plugin.json        symlink, or a real copy when hooks differ
  skills/ commands/ agents/ hooks/ .mcp.json README.md LICENSE
examples/project-setup/             project-level setup for every tool
docs/                               formats, lookup orders, test results
scripts/check.mjs                   validates links, manifests, skills and docs
```

## Make your own marketplace

1. **Copy the repo.** On GitHub, click **Use this template**, or:

   ```bash
   gh repo create my-org/my-marketplace --template CarterCole/example-ai-marketplace --public --clone
   ```

   A plain clone works too; point `origin` at your own repo afterwards:

   ```bash
   git clone https://github.com/CarterCole/example-ai-marketplace my-marketplace
   ```

   On Windows, turn on Developer Mode and add `-c core.symlinks=true` to the clone, or the symlinks arrive as text files.

2. **Rename it.** This rewrites the repo URL, the marketplace name (the `@suffix` in install commands) and the owner in every manifest and doc. Pick a marketplace name your users won't already have:

   ```bash
   node scripts/rename-marketplace.mjs my-org/my-marketplace my-marketplace --owner "My Team" --email team@example.com
   ```

3. **Swap in your plugins.** Delete the examples you don't need (the plugin folder and its entry in `.claude-plugin/marketplace.json`). Add your own by copying `plugins/changelog-writer`, renaming it and listing it in the marketplace; the [authoring guide](docs/authoring.md) has the rules.

4. **Check and push:**

   ```bash
   node scripts/check.mjs
   ```

   CI runs the same check on every push. Then send people the install commands above with your repo and marketplace name.

### Tell people how to install it

Paste this to your team, with your repo and plugin names:

```
Claude Code:  /plugin marketplace add my-org/my-marketplace
              /plugin install <plugin>@my-marketplace
Copilot CLI:  copilot plugin marketplace add my-org/my-marketplace
              copilot plugin install <plugin>@my-marketplace
Codex:        codex plugin marketplace add my-org/my-marketplace
              codex plugin add <plugin>@my-marketplace
Cursor:       /plugin marketplace add https://github.com/my-org/my-marketplace
VS Code:      add my-org/my-marketplace to chat.plugins.marketplaces
```

To have a project offer the marketplace automatically, commit a `.claude/settings.json` with `extraKnownMarketplaces` and `enabledPlugins`, like [the project example](examples/project-setup/.claude/settings.json). Claude Code and VS Code read it, and a symlink at `.github/copilot/settings.json` covers Copilot.

All docs are indexed in [docs/](docs/README.md).

## License

[MIT](LICENSE)
