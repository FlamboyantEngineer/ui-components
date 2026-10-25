---
'@flamboyantengineer/ui-components': minor
---

Add `ChatToolCall`, an assistant's tool call as a collapsible card for chats.

- Takes the call as plain data (`ChatToolCallData`: `id`, `name`, `label`, `status`, `args`, `result`, `error`, `durationMs`, `approval`). The trigger shows a status glyph, the label (derived from the tool's name when none is given), the status as text and the duration; `running` is busy, and an auto-approved call carries a badge.
- The body shows the arguments and result as formatted, read-only JSON in keyboard-scrollable views with Copy buttons, or `children` for a custom tool view. A failed call shows its error as an alert.
- Approvals: Approve, Deny with an optional reason (`onDeny(reason)`) and Always allow named by `approval.scopeLabel`, each shown only when its callback is given. While pending, Ctrl+Enter or Cmd+Enter approves and Escape focuses Deny, both shown as the buttons' shortcuts. Resolved approvals show the decision in a status and keep a focused button in place, `aria-disabled`.
- Expansion is controllable (`isExpanded`, `defaultExpanded`, `onExpandedChange`) and by default follows the status: open while an approval is requested or the call failed.
- Hooks: `ui-chat-tool-call` with its slots, `data-status`, `data-auto-approved`, `data-part`, `data-action` and `data-decision`. New provider strings (`toolCall…`, `copyToolCallPart`) and glyphs `hand-raised`, `no-symbol` and `x-circle`.
