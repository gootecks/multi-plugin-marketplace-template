---
name: changelog-writer
description: Turn git history into a CHANGELOG.md entry in the Keep a Changelog format (Added, Changed, Deprecated, Removed, Fixed, Security). Use when cutting a release, bumping a version, writing release notes, or when the user asks "what changed since the last tag".
---

# Changelog writer

## Gather the changes

1. Find the last release tag: `git describe --tags --abbrev=0`. If there is none, use the first commit.
2. List commits since then: `git log <tag>..HEAD --no-merges --pretty=format:'%h %s'`.
3. Read `CHANGELOG.md` if it exists so the new entry matches its style.

## Sort commits into sections

| Commit type | Section |
|-------------|---------|
| `feat` | Added |
| `fix` | Fixed |
| `perf`, `refactor` that users notice | Changed |
| anything with `BREAKING CHANGE` or `!` | Changed, prefixed with **Breaking:** |
| removals | Removed |
| security fixes | Security |

Leave out `chore`, `ci`, `test`, `build` and `docs` commits unless they change something users see.

## Write the entry

```markdown
## [1.4.0] - 2026-11-14

### Added
- Fuzzy matching in the command palette.

### Fixed
- Tokens are refreshed before they expire instead of after a failed request.
```

- One line per change, written for users: say what the software does now, not what the developer did.
- Put the newest version at the top, under an `## [Unreleased]` section if the project keeps one.
- Use today's date in ISO format.
- Ask before writing to `CHANGELOG.md`; show the entry first.
