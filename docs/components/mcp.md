# MCP servers

An MCP server gives the agent tools over the [Model Context Protocol](https://modelcontextprotocol.io). Local servers run as a child process over stdio; remote servers are reached over HTTP.

## In a plugin

| Tool | File | Variables |
|------|------|-----------|
| Claude Code | `.mcp.json` → `mcpServers` | `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `${user_config.KEY}` in `command`, `args`, `env` |
| Copilot CLI, VS Code | `.mcp.json` → `mcpServers` | `${CLAUDE_PLUGIN_ROOT}`, `${PLUGIN_ROOT}`, `${COPILOT_PLUGIN_ROOT}` |
| Codex | `.mcp.json` by default, or `mcpServers` in `.codex-plugin/plugin.json` (a path or an inline object) | no `${…}` expansion found in `.mcp.json`; a relative `cwd` resolves against the plugin root. The portable `mcp.json` expands `${PLUGIN_ROOT}` |
| Cursor | `mcp.json` (no dot) by default; point `"mcpServers": "./.mcp.json"` in its manifest | `${CURSOR_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_ROOT}`; servers appear as `plugin-<plugin>-<server>` |
| Gemini CLI | `mcpServers` in `gemini-extension.json` | `${extensionPath}`, `${workspacePath}` |

So one `.mcp.json` using `${CLAUDE_PLUGIN_ROOT}` covers Claude Code, Copilot, VS Code and Cursor. Codex needs `cwd` and a relative path, which [kitchen-sink](../../plugins/kitchen-sink/.codex-plugin/plugin.json) puts inline in its Codex manifest:

```json
"mcpServers": {
  "kitchen-sink": { "command": "node", "args": ["./mcp/server.mjs"], "cwd": "." }
}
```

A server that's installed separately (`uvx`, `npx`) needs no path at all, as in [commit-craft](../../plugins/commit-craft/.mcp.json).

## Remote servers

The key for an HTTP server differs per tool:

| Tool | Shape |
|------|-------|
| Claude Code, Copilot, Cursor | `{"type": "http", "url": "https://mcp.example.com/mcp"}` |
| Agent Plugins `mcp.json` | `{"type": "streamable-http", "url": "…"}` |
| Codex `config.toml` | `url = "…"`, with `bearer_token_env_var` or `http_headers` |
| Gemini CLI | `httpUrl` for streamable HTTP, `url` for SSE, plus `headers` |

## In a project

| Tool | File | Key |
|------|------|-----|
| Claude Code | `.mcp.json` | `mcpServers` |
| Copilot CLI | `.mcp.json` (searched from the working directory up to the repo root), or `.github/mcp.json` | `mcpServers`, loaded after folder trust |
| VS Code | `.mcp.json` in the Copilot harness; `.vscode/mcp.json` in the deprecated Local harness | `mcpServers`; `servers` in `.vscode/mcp.json` |
| Cursor | `.cursor/mcp.json` | `mcpServers` |
| Codex | `.codex/config.toml` | `[mcp_servers.<name>]` with `command`, `args`, `env`, `cwd`; loaded only in a trusted project |
| Gemini CLI | `.gemini/settings.json` | `mcpServers`, plus `cwd`, `timeout`, `trust`, `includeTools`, `excludeTools` |

[`examples/project-setup`](../../examples/project-setup) shares one `.mcp.json` with Cursor by symlink, and keeps checked copies for Gemini and Codex.

## Examples in this repo

- [`kitchen-sink/mcp/server.mjs`](../../plugins/kitchen-sink/mcp/server.mjs): a dependency-free stdio server shipped inside the plugin. Its `plugin_env` tool reports which plugin-root variables the host tool set.
- [`commit-craft/.mcp.json`](../../plugins/commit-craft/.mcp.json): an external server run with `uvx mcp-server-git`
- [`project-setup/.mcp.json`](../../examples/project-setup/.mcp.json), with copies in [`.gemini/settings.json`](../../examples/project-setup/.gemini/settings.json) and [`.codex/config.toml`](../../examples/project-setup/.codex/config.toml)
