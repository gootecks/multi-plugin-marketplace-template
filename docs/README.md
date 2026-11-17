# Docs

Everything this repo relies on about how each AI tool finds and loads plugins, checked against official docs and local tests on 2026-11-14.

## Start here

- [How it works](how-it-works.md): Claude Code's files are the source of truth, and each tool either reads them directly, gets a symlink, or gets a small real copy. Covers the lookup orders that make this work.
- [Compatibility](compatibility.md): every component against every tool, and what was tested versus only read in docs.
- [Authoring](authoring.md): adding a plugin, the rules that keep it working everywhere, versions, releases and local testing.
- [Official marketplace conventions](official-marketplace.md): what Anthropic's [claude-plugins-official](https://github.com/anthropics/claude-plugins-official) repo does, and what this repo copies from it.

## Components

One page per component type, comparing the formats across tools, with links to working examples in this repo.

- [Skills](components/skills.md)
- [Commands](components/commands.md)
- [Agents](components/agents.md)
- [Hooks](components/hooks.md), with the full event list in [events.md](../plugins/kitchen-sink/skills/explain-hook-event/references/events.md)
- [MCP servers](components/mcp.md)
- [Instructions and rules](components/instructions.md)
- [Components only some tools have](components/vendor-specific.md): LSP servers, output styles, `bin/`, user config, Codex apps, Cursor variables

## Tools

- [Claude Code](vendors/claude-code.md)
- [GitHub Copilot: CLI and VS Code](vendors/copilot.md)
- [OpenAI Codex](vendors/codex.md)
- [Cursor](vendors/cursor.md)
- [Gemini CLI](vendors/gemini.md)
- [Open standards: Agent Skills and Agent Plugins](vendors/open-standards.md)

## Examples in this repo

| Example | Shows |
|---------|-------|
| [`plugins/changelog-writer`](../plugins/changelog-writer) | the smallest plugin: one skill, Cursor manifest as a symlink |
| [`plugins/commit-craft`](../plugins/commit-craft) | a real plugin with every common component and one cross-tool hook |
| [`plugins/kitchen-sink`](../plugins/kitchen-sink) | one of every component, a logger on every hook event, a manifest per tool, an MCP server in the plugin |
| [`examples/project-setup`](../examples/project-setup) | project-level instructions, rules, skills, agents, commands, hooks and MCP for every tool |
