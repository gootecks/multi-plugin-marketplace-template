# Hook events by tool

Checked on 2026-11-14 against each tool's official hooks reference:
[Claude Code](https://code.claude.com/docs/en/hooks),
[Codex](https://learn.chatgpt.com/docs/hooks),
[Copilot CLI](https://docs.github.com/en/copilot/reference/hooks-configuration),
[VS Code](https://code.visualstudio.com/docs/agent-customization/hooks),
[Cursor](https://cursor.com/docs/hooks).

## Blocking and output, in one table

| | Claude Code | Codex | Copilot CLI / VS Code | Cursor |
|---|---|---|---|---|
| File format | `{"hooks": {"Event": [{"matcher", "hooks": [{"type": "command", "command"}]}]}}` | same as Claude | `{"version": 1, "hooks": {"event": [{"type": "command", "bash", "powershell", "timeoutSec"}]}}` | `{"version": 1, "hooks": {"event": [{"command", "matcher"}]}}` |
| Event names | PascalCase | PascalCase | camelCase (PascalCase aliases get Claude-style payloads) | camelCase |
| Block | exit 2, reason on stderr | exit 2, reason on stderr | exit 2 on `preToolUse` and `permissionRequest` | exit 2 |
| Deny a tool as JSON | `hookSpecificOutput.permissionDecision: "deny"` | same as Claude | top-level `permissionDecision: "deny"` | `permission: "deny"` with `user_message`, `agent_message` |
| Add context at session start | `hookSpecificOutput.additionalContext`, or plain stdout | same as Claude | top-level `additionalContext` | `additional_context` |
| "No opinion" | print nothing | print nothing | print `{}` | print `{}` (empty or invalid output blocks permission hooks) |
| Plugin root in the hook | `${CLAUDE_PLUGIN_ROOT}` | `${PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_ROOT}` | relative `./` paths | `${CURSOR_PLUGIN_ROOT}` (cwd is the plugin root, except `stop` and `subagentStop`) |

## Equivalent events

| What happens | Claude Code | Codex | Copilot CLI / VS Code | Cursor |
|---|---|---|---|---|
| Session starts | `SessionStart` | `SessionStart` | `sessionStart` | `sessionStart` |
| Session ends | `SessionEnd` | `SessionEnd` | `sessionEnd` | `sessionEnd` |
| Workspace opens | – | – | – | `workspaceOpen` |
| User sends a prompt | `UserPromptSubmit` | `UserPromptSubmit` | `userPromptSubmitted` | `beforeSubmitPrompt` |
| Prompt is rewritten | `UserPromptExpansion` (slash commands) | – | – (`userPromptTransformed` is documented, but Copilot CLI 1.0.18 doesn't load it) | – |
| Before any tool | `PreToolUse` | `PreToolUse` | `preToolUse` | `preToolUse` |
| Before a shell command | `PreToolUse` with matcher `Bash` | `PreToolUse` with matcher `Bash` | `preToolUse` | `beforeShellExecution` |
| Before an MCP tool | `PreToolUse` with matcher `mcp__.*` | `PreToolUse` | `preToolUse` | `beforeMCPExecution` |
| Before reading a file | `PreToolUse` with matcher `Read` | – | `preToolUse` | `beforeReadFile` |
| Permission prompt | `PermissionRequest` | `PermissionRequest` | `permissionRequest` | – |
| Permission denied | `PermissionDenied` | – | – | – |
| After a tool succeeds | `PostToolUse` | `PostToolUse` | `postToolUse` | `postToolUse`, `afterShellExecution`, `afterMCPExecution`, `afterFileEdit` |
| After a tool fails | `PostToolUseFailure` | – | `postToolUseFailure` | `postToolUseFailure` |
| After a batch of tool calls | `PostToolBatch` | – | – | – |
| Before or after a model request | – | `PreModelRequest`, `PostModelRequest` | – | – |
| Agent replies or thinks | – | – | – | `afterAgentResponse`, `afterAgentThought` |
| Agent finishes its turn | `Stop` | `Stop` | `agentStop` | `stop` |
| Turn fails on an API error | `StopFailure` | – | `errorOccurred` | – |
| User interrupts | – | `Interrupt` | – | – |
| Subagent starts | `SubagentStart` | `SubagentStart` | `subagentStart` | `subagentStart` |
| Subagent stops | `SubagentStop` | `SubagentStop` | `subagentStop` | `subagentStop` |
| Before compaction | `PreCompact` | `PreCompact` | `preCompact` | `preCompact` |
| After compaction | `PostCompact` | `PostCompact` | – | – |
| Notification shown | `Notification` | – | `notification` | – |
| Tab completion reads or edits | – | – | – | `beforeTabFileRead`, `afterTabFileEdit` |

## Events only Claude Code has

| Event | Fires when | Can |
|---|---|---|
| `Setup` | setup or maintenance runs (matcher `init` or `maintenance`) | nothing |
| `MessageDisplay` | each chunk of a reply is shown | change what is displayed |
| `TaskCreated`, `TaskCompleted` | a task-list item is created or completed | block |
| `TeammateIdle` | an agent-team teammate goes idle | keep it working |
| `InstructionsLoaded` | a CLAUDE.md or rule file is loaded | nothing |
| `ConfigChange` | a settings file or skill changes | block (except policy settings) |
| `CwdChanged`, `DirectoryAdded`, `FileChanged` | the working directory changes, a directory is added, a watched file changes | nothing (`FileChanged` needs `watchPaths` from `SessionStart`) |
| `WorktreeCreate`, `WorktreeRemove` | a git worktree is created or removed | `WorktreeCreate` *replaces* creation: the hook must print the new path |
| `PreModelSwitch`, `PostModelSwitch` | the model changes | block the switch, add context |
| `Elicitation`, `ElicitationResult` | an MCP server asks the user for input | answer, decline or block |

## Gemini CLI

Gemini extensions use `hooks/hooks.json` in Claude's nested shape with their own events: `BeforeTool`, `AfterTool`, `BeforeAgent`, `AfterAgent`, `BeforeModel`, `AfterModel`, `BeforeToolSelection`, `SessionStart`, `SessionEnd`, `Notification` and `PreCompress`. Timeouts are in milliseconds. This marketplace doesn't ship Gemini extensions; see the repo's `docs/vendors/gemini.md`.
