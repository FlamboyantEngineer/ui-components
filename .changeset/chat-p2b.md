---
'@flamboyantengineer/ui-components': minor
---

Add `useChatController`, which turns a host's `send` function into a chat's state and callbacks, with no backend of its own.

- `send(messages, { signal, waitFor })` returns an async iterable of library stream events (`ChatStreamEvent`): `text-delta`, `reasoning-delta`, `reasoning-end`, `tool-call`, `tool-result`, `approval-request`, `question`, `plan`, `plan-step`, `source`, `file`, `code`, `diff`, `custom`, `status`, `finish` and `error`. An adapter of a few lines maps another protocol's stream onto them; the lab shows one for an AG-UI-style stream and one for an AI SDK-style UI message stream.
- The hook returns `messages`, `isPending`, `queue`, `statusText`, `send(text, tokens?)`, `stop()`, `retry()`, `setMessages` and `props`, everything a chat needs: `messages`, `isPending`, `onSend`, `onStop`, `onRetry`, `onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`, `queue`, `onQueueChange`, `history`, `attachments`, `onAttach`, `onRemoveAttachment` and `onRetryAttachment`.
- Stop aborts the signal and keeps the partial reply as `cancelled`; errors mark the reply `error` and `retry` runs the turn again; messages sent during a reply wait in an editable queue and go out in order; the reader's prompts form the composer's recall history.
- Approvals and questions are awaited through `waitFor(id)` while the stream stays open, or end the turn and continue the reply once the reader answers. Always allow records the tool (`alwaysAllowed`, `onAlwaysAllowedChange`) and approves later requests without asking. Sending a message dismisses what waits for the reader. `isAwaitingReader(part)` tells which parts wait.
- With `upload(file, { signal, onProgress })`, attached files upload with their progress, can be retried or removed, and ride on the next message.
- `reduceChatStream(reply, event, context)`, the pure reducer the hook folds events with, for hosts that keep the conversation themselves.
- Provider string: `chatReplyFailed`.
