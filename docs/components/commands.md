# Commands

A command is a prompt the user runs by typing `/name`. Every tool has had its own format, so **prefer a skill with `disable-model-invocation: true`** for new slash commands: it loads the same way in Claude Code and every tool reads skills ([example](../../plugins/kitchen-sink/skills/show-events/SKILL.md)). Anthropic's official marketplace calls `commands/` the legacy layout.

## Formats

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | plugin `commands/*.md`; project `.claude/commands/` | Markdown; frontmatter `description`, `argument-hint`, `allowed-tools`, `model`; `$ARGUMENTS` in the body |
| Copilot CLI | plugin: only if the manifest lists `"commands"`; project `.claude/commands/` | same Markdown |
| VS Code | plugin `commands`; project prompt files `.github/prompts/*.prompt.md` (frontmatter `description`, `name`, `argument-hint`, `agent`, `model`, `tools`) | prompt files run only in the Local harness, which is deprecated and due for removal in February 2027 |
| Codex | plugin `commands/*.md` are turned into skills at install time if they have a `description` and are at most 4 KB | custom prompts are deprecated |
| Cursor | plugin `commands/`; project `.cursor/commands/` | `.md`, `.mdc`, `.markdown` or `.txt`, optional `name` and `description` |
| Gemini CLI | extension or project `.gemini/commands/*.toml`; subfolders namespace them (`git/commit.toml` → `/git:commit`) | TOML: `prompt` (required), `description`; `{{args}}`, `!{shell}`, `@{file}` |

## In a plugin

Claude Code treats a `commands` path in `plugin.json` as a *replacement* for the default folder. Listing the default, `"commands": "./commands/"`, keeps Claude Code unchanged and gives Copilot the path it needs:

```json
{
  "name": "commit-craft",
  "commands": "./commands/"
}
```

## Examples in this repo

- [`commit-craft/commands/commit.md`](../../plugins/commit-craft/commands/commit.md): `/commit`, with `argument-hint` and `$ARGUMENTS`
- [`kitchen-sink/commands/ping.md`](../../plugins/kitchen-sink/commands/ping.md): the legacy layout, labeled as such
- [`project-setup/.claude/commands/fix-issue.md`](../../examples/project-setup/.claude/commands/fix-issue.md): a project command, shared with Cursor through `.cursor/commands → .claude/commands`
