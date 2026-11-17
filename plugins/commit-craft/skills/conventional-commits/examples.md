# Examples

## Small fix

```
fix(auth): refresh token before it expires

Tokens were refreshed only after a 401, so every hour one request
failed. Refresh when less than 60 seconds remain instead.
```

## Feature with an issue reference

```
feat(search): add fuzzy matching to the command palette

Exact-prefix matching hid commands people half-remembered. Use the
existing trigram index so results stay under 5 ms.

Closes: #418
```

## Breaking change

```
feat(api)!: return ISO 8601 timestamps

BREAKING CHANGE: `created_at` and `updated_at` are now ISO 8601
strings instead of Unix seconds. Parse them with `Date.parse()`.
```

## Dependency bump

```
build(deps): bump undici from 6.19.2 to 6.21.0
```

## Too broad: split it

A diff that renames a module, fixes a bug in it and updates the README
should become three commits: `refactor`, `fix`, `docs`.
