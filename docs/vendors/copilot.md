# GitHub Copilot: CLI and VS Code

Both read Claude Code plugins and marketplaces as they are. Sources:
- Copilot CLI: [plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference), [marketplaces](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace), [hooks configuration](https://docs.github.com/en/copilot/reference/hooks-configuration), [custom agents](https://docs.github.com/en/copilot/reference/custom-agents-configuration), [instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions), [MCP servers](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)
- VS Code: [agent plugin reference](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference), [agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins), [AI settings](https://code.visualstudio.com/docs/agents/reference/ai-settings), [skills](https://code.visualstudio.com/docs/agent-customization/agent-skills), [instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions), [hooks](https://code.visualstudio.com/docs/agent-customization/hooks), [overview](https://code.visualstudio.com/docs/agent-customization/overview)

Checked 2026-11-14; CLI behavior tested with Copilot CLI 1.0.18.

## Install from this repo

Copilot CLI:

```bash
copilot plugin marketplace add CarterCole/example-ai-marketplace
```

```bash
copilot plugin install commit-craft@example-ai-marketplace
```

Other sources: `copilot plugin install owner/repo`, `owner/repo:path/to/plugin`, a git URL or `./path`. `github/copilot-plugins` and `github/awesome-copilot` are built in.

VS Code: plugins are off by default. In user settings:

```json
"chat.plugins.enabled": true,
"chat.plugins.marketplaces": [
  "github/copilot-plugins",
  "github/awesome-copilot",
  "CarterCole/example-ai-marketplace"
]
```

The list replaces the default, so keep GitHub's two. Then install from the Customizations editor's **Browse** page, with **Chat: Install Plugin from Source**, `/plugin install`, or a `vscode://chat-plugin/install?source=…&plugin=…` link. VS Code also picks up plugins the CLI installed in `~/.copilot/installed-plugins/`.

## Lookup order

| File | Order |
|------|-------|
| Marketplace | `marketplace.json`, `.plugin/marketplace.json`, `.github/plugin/marketplace.json`, `.claude-plugin/marketplace.json` |
| Plugin manifest | root `plugin.json` with the [Agent Plugins](open-standards.md#agent-plugins-10) `$schema`, then `.plugin/plugin.json`, `plugin.json`, `.github/plugin/plugin.json`, `.claude-plugin/plugin.json` |

## Manifest

- **Fields:** `name` (kebab-case, at most 64 characters), `description`, `version`, `author` (`name`, `email`, `url`), `homepage`, `repository`, `license`, `keywords`, `tags` and `category`.
- **Component paths,** relative to the plugin folder:

| Field | Default |
|-------|---------|
| `agents` | `agents/` |
| `skills` | `skills/` |
| `commands` | **none**: list it, or commands don't load |
| `hooks` | `hooks/hooks.json` (loaded from a Claude manifest in testing) |
| `mcpServers` | `.mcp.json` |
| `lspServers`, `extensions` | |

Marketplace entries add `strict` (default `true`), component fields, and sources: a relative path, `{"source": "github", "repo", "ref", "path", "sha"}`, or a `url` with `sha`.

## Components

- **Agents:** `.agent.md` or plain `.md`. `description` is required. Claude tool names are mapped (`Read`→`read`, `Bash`→`execute`, `Task`→`agent`) and unknown ones are ignored. Plugin agents are namespaced `plugin:agent`.
- **Hooks:** `{"version": 1, "hooks": {"preToolUse": [{"type": "command", "bash": "…", "powershell": "…", "timeoutSec": 30}]}}`.
  - **Events:** `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `permissionRequest`, `agentStop`, `subagentStart`, `subagentStop`, `preCompact`, `notification` and `errorOccurred`.
  - **Aliases:** PascalCase names such as `PreToolUse` get Claude-style payloads.
  - **Output:** top-level JSON (`permissionDecision`, `additionalContext`), not `hookSpecificOutput`.
  - **Exit codes:** exit 2 denies only for `preToolUse` and `permissionRequest`. `preToolUse` fails closed on other non-zero exits. Timeouts fail open.
  - See [hooks](../components/hooks.md).
- **MCP:** `.mcp.json` with `mcpServers`. Accepts `${CLAUDE_PLUGIN_ROOT}`, `${PLUGIN_ROOT}` and `${COPILOT_PLUGIN_ROOT}`.

## Project files

| Purpose | Files |
|---------|-------|
| Instructions | `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` (`applyTo`), `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md` |
| Skills | `.claude/skills`, `.agents/skills`, `.github/skills`; user: `~/.copilot/skills`, `~/.agents/skills` (not `~/.claude/skills`) |
| Agents | `.claude/agents`, `.github/agents/*.agent.md` |
| Commands | `.claude/commands` |
| Hooks | `.github/hooks/*.json`; inline `hooks` in `.github/copilot/settings.json` |
| MCP | `.mcp.json` (searched upward to the repo root) or `.github/mcp.json`, after folder trust. `.vscode/mcp.json` is not read |
| Plugin recommendations | `extraKnownMarketplaces` and `enabledPlugins` in `.github/copilot/settings.json`; VS Code also reads `.claude/settings.json` |

## VS Code settings and defaults

| Setting | Default |
|---------|---------|
| `chat.plugins.enabled` | `false` |
| `chat.plugins.marketplaces` | `["github/copilot-plugins", "github/awesome-copilot"]` |
| `chat.useAgentSkills` | `true` |
| `chat.instructionsFilesLocations` | `.github/instructions`, `.claude/rules`, `~/.copilot/instructions`, `~/.claude/rules` |
| `chat.agentFilesLocations` | `.github/agents`, `.claude/agents`, `~/.copilot/agents` |
| `chat.useClaudeMdFile`, `chat.useAgentsMdFile` | `true` |
| `chat.useHooks` | `true` |
| `chat.useClaudeHooks` | `false` (Local harness) |
| `chat.hookFilesLocations` | `{}` |

## Tested here

- `copilot plugin marketplace add ./` reads `.claude-plugin/marketplace.json`.
- Installing turns symlinks into real files in `~/.copilot/installed-plugins/`.
- From a plain Claude manifest, Copilot loads the plugin's agents and `hooks/hooks.json`.
- The install summary counts only skills ("Installed 1 skill") even when agents and hooks load. Use `copilot --agent nope -p ok --log-level debug --log-dir <dir>` to list agents without calling a model; the log says `Loaded N hook(s)`.
- Version 1.0.18 doesn't load the documented `userPromptTransformed` event.
- On Windows, symlinks break unless `core.symlinks=true` ([copilot-cli#2286](https://github.com/github/copilot-cli/issues/2286)).
