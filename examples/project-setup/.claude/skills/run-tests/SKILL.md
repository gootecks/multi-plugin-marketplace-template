---
name: run-tests
description: Run this project's test suite and report failures. Use after changing code, before committing, or when asked to "run the tests" or "check if it still works".
---

# Run the tests

1. Run `npm test -- --reporter=dot`.
2. If tests fail, show each failing test's name and the first assertion error, then read the failing test before proposing a fix.
3. Run a single file with `npm test -- path/to/file.test.ts`.
