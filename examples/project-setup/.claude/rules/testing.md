---
description: How tests are written in this project
paths:
  - "**/*.test.ts"
globs: "**/*.test.ts"
alwaysApply: false
---

- Use `describe` / `it` from Vitest; no Jest globals.
- One behavior per `it`; name it as a sentence ("returns 404 when the user is missing").
- No network calls in unit tests; use the fakes in `test/fakes/`.
