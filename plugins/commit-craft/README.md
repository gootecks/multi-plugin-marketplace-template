# commit-craft

Conventional Commits for every agent: a skill that writes the message, a `/commit` command, a reviewer agent, a hook that blocks force-pushes to `main` or `master`, and a git MCP server.

## Install

| Tool | Command |
|------|---------|
| Claude Code | `/plugin install commit-craft@example-ai-marketplace` |
| Copilot CLI | `copilot plugin install commit-craft@example-ai-marketplace` |
| Codex | `codex plugin add commit-craft@example-ai-marketplace` |
| Cursor, VS Code | install from the marketplace browser |

Add the marketplace first; see the [repo README](../../README.md#install).

## What's inside

| Component | File | Works in |
|-----------|------|----------|
| Skill | [`skills/conventional-commits/`](skills/conventional-commits/SKILL.md) | all |
| Command `/commit` | [`commands/commit.md`](commands/commit.md) | Claude Code, Copilot, Cursor; Codex turns it into a skill |
| Agent | [`agents/diff-reviewer.md`](agents/diff-reviewer.md) | Claude Code, Copilot, Cursor |
| Hook: block force-push | [`hooks/guard-force-push.mjs`](hooks/guard-force-push.mjs) via [`hooks/hooks.json`](hooks/hooks.json) | Claude Code, Codex, Copilot |
| Same hook, Cursor format | [`hooks/cursor-hooks.json`](hooks/cursor-hooks.json) | Cursor |
| MCP server `git` | [`.mcp.json`](.mcp.json) | all; needs [`uv`](https://docs.astral.sh/uv/) for `uvx` |
| Rule | [`rules/commit-style.mdc`](rules/commit-style.mdc) | Cursor |

## The force-push guard

It blocks `git push --force`, `-f`, combined flags such as `-uf`, and `+branch` refspecs when the target is `main` or `master`, or when no target is given and the current branch is one of them. It allows `--force-with-lease`. It blocks by exiting with code 2, which every supported tool treats as "deny".

To protect more branches, edit `PROTECTED` at the top of the script.
