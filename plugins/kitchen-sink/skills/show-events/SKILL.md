---
name: show-events
description: Show the most recent hook events the kitchen-sink plugin logged, grouped by tool and event.
argument-hint: "[number of events, default 20]"
disable-model-invocation: true
---

# Show logged hook events

This is the **user-invoked** skill example: `disable-model-invocation: true` means it runs only when someone types `/show-events`, and `argument-hint` is shown next to it in the menu. It also shows a skill that bundles a script.

Run the bundled script and show its output as is:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/show-events/scripts/summarize.mjs" $ARGUMENTS
```

If `CLAUDE_PLUGIN_ROOT` is empty (some tools don't set it), run `scripts/summarize.mjs` from this skill's folder instead.

If the log is empty, say that no hook has fired yet and that a new session should log a session-start event.
