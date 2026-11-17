# changelog-writer

Turns git history since the last tag into a [Keep a Changelog](https://keepachangelog.com) entry.

This is the smallest plugin shape: one skill and two manifests, where the Cursor manifest is a symlink to Claude's. Copy this folder to start a new plugin:

```bash
cp -R plugins/changelog-writer plugins/my-plugin
```

## Install

| Tool | Command |
|------|---------|
| Claude Code | `/plugin install changelog-writer@example-ai-marketplace` |
| Copilot CLI | `copilot plugin install changelog-writer@example-ai-marketplace` |
| Codex | `codex plugin add changelog-writer@example-ai-marketplace` |
| Cursor, VS Code | install from the marketplace browser |
| Gemini CLI | `gemini skills install https://github.com/CarterCole/example-ai-marketplace --path plugins/changelog-writer/skills/changelog-writer` |

## What's inside

| File | Purpose |
|------|---------|
| [`skills/changelog-writer/SKILL.md`](skills/changelog-writer/SKILL.md) | the skill; every tool reads it |
| `.claude-plugin/plugin.json` | manifest for Claude Code, Copilot and Codex |
| `.cursor-plugin/plugin.json` | symlink to the Claude manifest, for Cursor |
