---
description: Legacy commands/ format example. Replies "pong" and echoes the arguments.
argument-hint: "[anything]"
---

This is the **legacy `commands/` format**. Claude Code loads it the same way as a skill. New slash commands should be skills with `disable-model-invocation: true` (see `skills/show-events`), because every tool reads skills, but not every tool reads `commands/`.

Reply with exactly `pong` followed by these arguments, if any: $ARGUMENTS
