---
description: Draft a Conventional Commits message for the staged changes and commit after you approve it
argument-hint: "[extra context for the message]"
---

Write a commit message for the currently staged changes using the conventional-commits skill.

1. Run `git diff --cached --stat` and `git diff --cached`. If nothing is staged, tell me and stop.
2. Draft the message. Use this extra context from me if any: $ARGUMENTS
3. Show me the draft and wait for my approval before running `git commit`.
