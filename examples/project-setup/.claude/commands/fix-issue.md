---
description: Fix a GitHub issue by number, with a test that proves it
argument-hint: "<issue number>"
---

Fix GitHub issue #$ARGUMENTS.

1. Read it with `gh issue view $ARGUMENTS`.
2. Write a failing test that reproduces it.
3. Fix the code until the test passes, then run the whole suite.
4. Summarize the cause and the fix in two sentences.
