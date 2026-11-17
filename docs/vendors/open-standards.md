# Open standards

## Agent Skills

[agentskills.io](https://agentskills.io/specification) defines the `SKILL.md` format that every tool here reads. The rules are summarized in [skills](../components/skills.md#format). The spec doesn't mandate folders; its [client guide](https://agentskills.io/client-implementation/adding-skills-support) recommends `.<client>/skills` plus `.agents/skills` in the project and home folder, and notes that some clients also scan `.claude/skills`.

`node scripts/check.mjs` enforces the spec's naming rules on every skill in this repo.

## Agent Plugins 1.0

[agent-plugins.org](https://agent-plugins.org/specification) is a vendor-neutral plugin format. Its steering committee is Amazon, Cursor, Microsoft, OpenAI and Vercel; Anthropic isn't on it.

- **Manifest:** a root `plugin.json` with `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`. The schema is closed: `name`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `extensions`.
- **Components:** fixed locations, `skills/` and `mcp.json` (with its own `$schema`, and an explicit `type` per server: `stdio`, `streamable-http` or `sse`). There are no component path fields.
- **Tool-specific settings:** under `extensions` keyed by reverse domain (`"com.openai"`), or in reverse-domain folders such as `com.github.copilot/`.
- **Versions:** the spec repo has 1.0.0 and 1.1.0; Codex accepts only 1.0.0.

Who reads it:

| Tool | Effect of a root Agent Plugins `plugin.json` |
|------|----------------------------------------------|
| Copilot CLI, VS Code | read **before** `.claude-plugin/plugin.json` |
| Codex | read before `.codex-plugin/`; skills locked to `skills/`, MCP to `mcp.json`; `extensions["com.openai"]` disables the `.codex-plugin` overlay |
| Cursor | supports skills and MCP only from it; `.cursor-plugin/plugin.json` is still needed for everything else |
| Claude Code | not documented as a reader |

**This repo doesn't use it yet.** A root `plugin.json` would make Copilot and Codex ignore Claude's manifest, and Claude Code doesn't read it. `scripts/check.mjs` fails on one. Revisit once Claude Code supports it.
