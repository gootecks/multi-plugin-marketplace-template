# Agents

An agent (subagent) is a separate assistant with its own instructions, and optionally its own tools and model, that the main agent hands work to.

## Formats

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | plugin `agents/*.md`; project `.claude/agents/` | Markdown; frontmatter `name`, `description`, optional `tools`, `model`, `color` |
| Copilot CLI | plugin `agents/` (default); project `.claude/agents/`, `.github/agents/*.agent.md` | Markdown; `description` required; optional `name`, `target`, `tools`, `model`, `disable-model-invocation`, `user-invocable`, `mcp-servers`, `metadata`. Claude tool names are mapped (`Read`→`read`, `Bash`→`execute`, `Task`→`agent`), and unknown tools are ignored. Plain `.md` loads (tested) |
| VS Code | plugin `agents/`; project `.github/agents/`, `.claude/agents/` | same as Copilot |
| Codex | project `.codex/agents/*.toml`; **plugins can't ship agents** | TOML: `name`, `description`, `developer_instructions` |
| Cursor | plugin `agents/`; project `.claude/agents/` | Markdown; `name`, `description`, optional `model`, `readonly`, `is_background` |
| Gemini CLI | extension `agents/*.md` | preview |

Plugin agents are namespaced: Copilot lists `commit-craft:diff-reviewer`.

## Writing one agent for every tool

Keep the frontmatter to `name` and `description`. Tool lists and model names differ per tool: Claude's `model: sonnet` means nothing to Cursor. Put constraints in the body instead ("You read files and run read-only commands; you don't edit anything").

For Codex, keep a TOML copy in the project's `.codex/agents/`. It can't be a symlink, because the format differs.

## Examples in this repo

- [`commit-craft/agents/diff-reviewer.md`](../../plugins/commit-craft/agents/diff-reviewer.md)
- [`kitchen-sink/agents/hook-debugger.md`](../../plugins/kitchen-sink/agents/hook-debugger.md): uses the plugin's MCP tool `recent_events`
- [`project-setup/.claude/agents/test-writer.md`](../../examples/project-setup/.claude/agents/test-writer.md) and its Codex copy [`test-writer.toml`](../../examples/project-setup/.codex/agents/test-writer.toml)
