# Compatibility

✓ supported · ✗ not supported · – not applicable. "Tested" means run on this machine on 2026-11-14; everything else comes from official docs or source code (linked from each [vendor page](README.md#tools)).

## Plugin components

| Component | Claude Code | Copilot CLI | VS Code | Codex | Cursor | Gemini CLI |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|
| Marketplace from `.claude-plugin/marketplace.json` | ✓ tested | ✓ tested | ✓ | ✓ | via symlink | ✗ no marketplaces |
| Manifest from `.claude-plugin/plugin.json` | ✓ tested | ✓ tested | ✓ | ✓ | via symlink | ✗ needs `gemini-extension.json` at repo root |
| Skills `skills/<name>/SKILL.md` | ✓ tested | ✓ tested | ✓ | ✓ | ✓ | ✓ via `gemini skills install --path` |
| Commands `commands/*.md` | ✓ tested | ✓ with `"commands"` field | ✓ | turned into skills | ✓ | ✗ TOML only |
| Agents `agents/*.md` | ✓ tested | ✓ tested | ✓ | ✗ | ✓ | preview |
| Hooks `hooks/hooks.json` (Claude format) | ✓ tested, fired live | ✓ loaded (tested), PascalCase subset | unverified | ✓ shared events | ✗ own format | ✗ own events |
| Hooks in the tool's own format | – | `copilot-hooks.json`, loaded (tested) | same file as Copilot | `codex-hooks.json` | `cursor-hooks.json` | – |
| MCP `.mcp.json` | ✓ tested | ✓ | ✓ | ✓ (no `${…}` expansion) | ✓ via `"mcpServers"` | – |
| Rules `rules/*.mdc` | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| LSP `.lsp.json` | ✓ | ✓ `lspServers` | – | ✗ | ✗ | ✗ |
| Output styles | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Project-level files

| Purpose | Claude Code | Copilot CLI | VS Code | Codex | Cursor | Gemini CLI |
|---------|-------------|-------------|---------|-------|--------|------------|
| Instructions | `CLAUDE.md` | `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md` | `CLAUDE.md`, `AGENTS.md` | `AGENTS.md` | `AGENTS.md` | `GEMINI.md` |
| Scoped rules | `.claude/rules/*.md` (`paths:`) | `.github/instructions/*.instructions.md` (`applyTo:`) | `.claude/rules`, `.github/instructions` | – | `.cursor/rules/*.mdc` (`globs:`) | – |
| Skills | `.claude/skills` | `.claude/skills`, `.agents/skills`, `.github/skills` | same | `.agents/skills` | `.claude/skills` | `.agents/skills`, `.gemini/skills` |
| Agents | `.claude/agents` | `.claude/agents`, `.github/agents/*.agent.md` | `.claude/agents`, `.github/agents` | `.codex/agents/*.toml` | `.claude/agents` | – |
| Hooks | `.claude/settings.json` | `.github/hooks/*.json`, `.github/copilot/settings.json` | Copilot harness: `.github/hooks`, `.claude/settings.json` | `.codex/hooks.json` | `.cursor/hooks.json`, `.claude/settings.json` | `.gemini/settings.json` |
| MCP | `.mcp.json` | `.mcp.json`, `.github/mcp.json` | `.mcp.json` (Copilot harness), `.vscode/mcp.json` (`servers` key) | `.codex/config.toml` | `.cursor/mcp.json` | `.gemini/settings.json` |

[`examples/project-setup`](../examples/project-setup) wires all of these to one set of Claude files.

## What was tested

| Tool | Version | What ran | Result |
|------|---------|----------|--------|
| Claude Code | 2.1.289 | `claude plugin validate --strict` on the marketplace and every plugin | pass |
| | | marketplace add + install of every plugin, from a local path and from `CarterCole/example-ai-marketplace` on GitHub, in a throwaway `CLAUDE_CONFIG_DIR` | pass; `plugin details` lists every component |
| | | GitHub Actions (`.github/workflows/check.yml`) | pass, including `claude plugin validate --strict` on the runner |
| | | 37 event names through the validator | all 33 Claude events accepted; Codex-only `PreModelRequest`, `PostModelRequest`, `Interrupt` rejected |
| | | headless session with `kitchen-sink` loaded | `InstructionsLoaded`, `SessionStart`, `UserPromptSubmit`, `StopFailure`, `SessionEnd` fired and were logged; the model call failed on an expired CLI login, so `PreToolUse` and the force-push guard were not reached |
| Copilot CLI | 1.0.18 | marketplace add from a local path and from GitHub, in a throwaway `COPILOT_HOME` | reads `.claude-plugin/marketplace.json` |
| | | install every plugin | pass; symlinks turned into real files in the cache |
| | | agents and hooks loaded (via `--agent` and the debug log) | `commit-craft:diff-reviewer` and its hook load from the plain Claude manifest; kitchen-sink loads 13 Copilot-format hooks; `userPromptTransformed` is not loaded |
| Hook and MCP scripts | Node 25 | sample payloads for each tool's format; a JSON-RPC session against the MCP server | correct exit codes and output per tool; MCP `initialize`, `tools/list`, `tools/call` and error replies work |
| Codex | – | not run: the local `codex` install is missing its native binary | docs and source only |
| Cursor, VS Code, Gemini CLI | – | not installed or not run | docs only |

## Known gaps

- No live test yet of a hook *blocking* a tool call in any tool. The guard scripts are tested with sample payloads only.
- VS Code's handling of Claude-format plugin hooks is not documented. Its docs say sharing a file location "does not establish runtime compatibility".
- Cursor reading `.md` rules through the `.cursor/rules` symlink, and commands through `.cursor/commands`, is unverified.
- Copilot CLI may load `CLAUDE.md`, `AGENTS.md` and `GEMINI.md` all at once; with symlinks that is the same text up to three times.
