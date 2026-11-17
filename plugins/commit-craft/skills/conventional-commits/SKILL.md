---
name: conventional-commits
description: Write git commit messages in the Conventional Commits format (type(scope): subject, body, footers). Use whenever you are about to run git commit, draft or fix a commit message, squash commits, write a PR title, or the user asks for a "good commit message", even if they never say "conventional".
---

# Conventional Commits

Format every commit message as:

```
<type>(<optional scope>): <subject>

<optional body>

<optional footers>
```

## Type

Pick the one that describes the change from the user's point of view:

| Type | Use for |
|------|---------|
| `feat` | A new capability users can see |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Code change with no behavior change |
| `perf` | Faster or smaller, same behavior |
| `test` | Adding or fixing tests only |
| `build` | Build system, dependencies, packaging |
| `ci` | CI configuration |
| `chore` | Anything else that does not touch src or tests |
| `revert` | Reverts an earlier commit |

## Subject line

- Imperative mood: "add", not "added" or "adds".
- Lower-case first word, no trailing period.
- 72 characters or fewer including the type and scope.
- Scope is a short noun for the area touched (`api`, `auth`, `deps`). Leave it out when the change is broad.

## Body

- Wrap at 72 columns.
- Explain **why** the change was made and what it replaces. The diff already shows what changed.
- Separate from the subject with one blank line.

## Footers

- `BREAKING CHANGE: <what breaks and how to migrate>`; also add `!` after the type: `feat(api)!: drop v1 routes`.
- Issue references: `Refs: #123`, `Closes: #123`.
- Keep any attribution lines the project or tool requires (for example `Co-Authored-By:`) as the last footers.

## Process

1. Read the staged diff (`git diff --cached`). If nothing is staged, say so and stop.
2. If the diff mixes unrelated changes, suggest splitting it before writing a message.
3. Draft the message, then check it against the rules above before committing.

See [examples.md](examples.md) for worked examples.
