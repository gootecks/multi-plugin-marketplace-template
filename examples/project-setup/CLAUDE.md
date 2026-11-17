# Example project

This file is the one copy of the project instructions. `AGENTS.md` and
`GEMINI.md` are symlinks to it, so every agent reads the same text.

## Build and test

- Install: `npm ci`
- Test: `npm test`
- Lint: `npm run lint`

## Conventions

- TypeScript strict mode; no `any` without a comment saying why.
- Commit messages follow Conventional Commits (the commit-craft plugin
  enforces this).
