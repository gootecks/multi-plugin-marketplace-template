# Skills

A skill is a folder with a `SKILL.md`: YAML frontmatter that says when to use it, then Markdown instructions. Optional `scripts/`, `references/` and `assets/` folders sit next to it, and the body links to them. Skills are the one component every tool reads in the same format, which makes them the most portable way to ship anything.

## Format

The [Agent Skills spec](https://agentskills.io/specification) is the common core:

| Field | Required | Rule |
|-------|:-:|------|
| `name` | ✓ | 1–64 characters, `a-z`, `0-9` and single hyphens, no leading or trailing hyphen; must equal the folder name |
| `description` | ✓ | 1–1024 characters; what it does **and** when to use it, because this is all the agent sees until it loads the skill |
| `license` | | |
| `compatibility` | | up to 500 characters |
| `metadata` | | string-to-string map |
| `allowed-tools` | | experimental |

Keep the body under 500 lines; move detail into `references/`.

Fields some tools add on top. Unknown fields are ignored, so they're safe to include:

| Field | Tools | Effect |
|-------|-------|--------|
| `argument-hint` | Claude Code, VS Code | shown next to the slash command |
| `disable-model-invocation: true` | Claude Code, VS Code, Cursor | runs only when the user types `/name`, which makes it a slash command |
| `user-invocable: false` | Claude Code, VS Code | hidden from the slash menu; the model can still load it |
| `context: fork` | VS Code | runs in a separate context |
| `paths`, `icon`, `color` | Cursor | file globs that attach it, menu icon and color |
| `agents/openai.yaml` next to `SKILL.md` | Codex | interface, `policy.allow_implicit_invocation`, dependencies |

`$ARGUMENTS` in the body is replaced with what the user typed after the slash command in Claude Code. `${CLAUDE_PLUGIN_ROOT}` is expanded in skill bodies in Claude Code.

## Where skills live

| | Plugin | Project | User |
|---|---|---|---|
| Claude Code | `skills/` | `.claude/skills/` | `~/.claude/skills/` |
| Copilot CLI | `skills/` | `.claude/skills/`, `.agents/skills/`, `.github/skills/` | `~/.copilot/skills/`, `~/.agents/skills/` |
| VS Code | `skills/` | `.agents/skills/`, `.github/skills/`, `.claude/skills/` | `~/.agents/skills/`, `~/.copilot/skills/`, `~/.claude/skills/` |
| Codex | `skills/` | `.agents/skills/` (from the working directory up to the repo root) | `~/.agents/skills/` |
| Cursor | `skills/` | `.claude/skills/` (third-party configs, on by default) | |
| Gemini CLI | extension `skills/` | `.agents/skills/`, `.gemini/skills/` | `gemini skills install` |

In a project, `.claude/skills/` plus a symlink `.agents/skills → .claude/skills` reaches every tool.

## Examples in this repo

| Skill | Shows |
|-------|-------|
| [`conventional-commits`](../../plugins/commit-craft/skills/conventional-commits/SKILL.md) | a model-invoked skill with a second file ([`examples.md`](../../plugins/commit-craft/skills/conventional-commits/examples.md)) linked from the body |
| [`changelog-writer`](../../plugins/changelog-writer/skills/changelog-writer/SKILL.md) | the minimal plugin: one skill |
| [`explain-hook-event`](../../plugins/kitchen-sink/skills/explain-hook-event/SKILL.md) | a bundled `references/` file |
| [`show-events`](../../plugins/kitchen-sink/skills/show-events/SKILL.md) | a user-invoked slash command (`disable-model-invocation`, `argument-hint`, `$ARGUMENTS`) with a bundled script |
| [`run-tests`](../../examples/project-setup/.claude/skills/run-tests/SKILL.md) | a project skill |
