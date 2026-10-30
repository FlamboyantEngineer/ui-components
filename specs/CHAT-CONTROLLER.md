# Chat Controller

`useChatController(options)` turns a host's `send` function, which streams an assistant's reply as library events, into the state and callbacks of a chat: the messages with their streaming reply, stop, retry, errors, a queue of follow-ups, approvals, questions, the reader's prompt history and uploads. It has no backend of its own: `send` talks to whatever service the host uses, and an adapter of a few lines maps that service's stream onto the events below. The hook returns the state, imperative `send`, `sendNow`, `stop`, `retry`, `updateMessages` and `resetConversation`, and `props`, everything a chat needs to spread into it. `reduceChatStream`, the pure reducer the hook folds events with, is exported for hosts that keep the conversation themselves.

Messages are [`ChatMessageData`](CHAT-PARTS.md) values whose content is an ordered list of typed parts ([Chat Parts](CHAT-PARTS.md)). The reader's messages carry `authorId: currentUserId`, the replies `authorId: assistantId`.

## Stream events

`send(messages, { signal, waitFor })` returns an async iterable of plain objects, one per step of the reply:

| Event              | Fields                                              | Effect on the reply                                                                                               |
| ------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `text-delta`       | `text`                                              | Appends to the open text part, or starts a streaming text part.                                                   |
| `reasoning-delta`  | `id`, `text`                                        | Appends to the reasoning part `id`, or starts it, streaming.                                                      |
| `reasoning-end`    | `id`, `durationMs?`                                 | Completes the reasoning part `id`.                                                                                |
| `tool-call`        | `id`, `name`, `label?`, `target?`, `kind?`, `args?` | Adds the tool call `id`, running, or updates its name, label, target, kind and arguments.                         |
| `tool-result`      | `id`, `result?`, `error?`, `durationMs?`            | Ends the tool call `id`: `failed` with an `error`, else `succeeded`; a denied call stays denied.                  |
| `approval-request` | `id`, `scopeLabel?`, `await?`                       | Puts the tool call `id` in `approval-requested`, or runs it auto-approved when the reader always allows its tool. |
| `question`         | `id`, `questions`, `await?`                         | Adds a pending question card.                                                                                     |
| `plan`             | `id`, `title?`, `steps`                             | Adds the plan `id`, or replaces its title and steps.                                                              |
| `plan-step`        | `planId`, `stepId`, `status`                        | Moves one step of a plan.                                                                                         |
| `source`           | `source`                                            | Adds a source to the reply's one sources part, or replaces the source with its `id`.                              |
| `file`             | `attachment`                                        | Adds a file to the files part just before it, or starts a files part.                                             |
| `code`             | `id?`, `code`, `language?`, `title?`, `variant?`    | Adds a code block (`variant: 'terminal'` for terminal output), or replaces the one with its `id`.                 |
| `diff`             | `id?`, `title?`, `oldText`, `newText`               | Adds a diff, or replaces the one with its `id`.                                                                   |
| `custom`           | `id?`, `name`, `data?`                              | Adds a part the host draws itself, or replaces the one with its `id`.                                             |
| `status`           | `text`                                              | Sets the reply's `statusText`; an empty text clears it.                                                           |
| `finish`           |                                                     | Ends the reply.                                                                                                   |
| `error`            | `message`                                           | Ends the reply as failed with `message`.                                                                          |

## UIC-CHAT-CONTROLLER-1 - Reducer

### UIC-CHAT-CONTROLLER-1.1 - Text

`reduceChatStream(reply, event, context)` shall append a `text-delta` to the reply's open text part, the last part other than its sources list, while that part streams, and start a new streaming text part otherwise. Adding a part of any other kind, except a source, shall complete the open text part, so text after a tool call starts a new text part while sources arriving between citations do not split the text.

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.2 - Reasoning

A `reasoning-delta` shall append to the reasoning part with its `id`, or add that part streaming, and complete any other streaming text or reasoning part. A `reasoning-end`, or any part added after the reasoning, shall complete it with the event's `durationMs`, else the duration `context.getElapsed(id)` reports.

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.3 - Tool calls

A `tool-call` shall add a running tool call, or merge its name, label, target, kind and arguments into the call with its `id` without changing that call's status, so arguments can stream. A `tool-result` shall mark the call `failed` with its `error`, else `succeeded` with its `result`, and set its duration from the event, else from `context.getElapsed(id)`; a denied call keeps its status and takes the result or error.

Implementation: `src/components/chat-controller/chat-stream.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.4 - Approval requests

An `approval-request` shall put the tool call `id` in `approval-requested` with `approval.scopeLabel`. When `context.alwaysAllowed` holds the call's tool name, the call shall run instead, with `approval.isAutoApproved` and no pending decision.

Implementation: `src/components/chat-controller/chat-stream.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.5 - Questions and plans

A `question` shall add a pending question card. A `plan` shall add a plan, or replace the title and steps of the plan with its `id`, and a `plan-step` shall move that step to its status. A part arriving again with an `id` the reply holds shall merge into it in place, keep its status and leave the open text part open, so an answered card stays answered and a plan update does not split the text.

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.6 - Sources, files, code, diffs and custom parts

A `source` shall go into the reply's one sources part, created where the first source arrives, replacing a source with the same `id`, so `[n]` markers number the sources in arrival order. A `file` shall join the files part just before it, or start one. `code`, `diff` and `custom` shall add their part, or replace the part of their type with their `id`.

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.7 - Status, finish and errors

A `status` shall set the reply's `statusText`, and an empty text shall clear it. A `finish` shall complete the reply: streaming parts complete, pending and running tool calls are cancelled, the status line clears, and approvals and questions that wait for the reader stay. An `error` shall end the reply the same way with `status: 'error'` and its `message` as `error`, and cancel the approvals and dismiss the questions that waited.

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

### UIC-CHAT-CONTROLLER-1.8 - Purity

The reducer shall return a new reply and leave the given one unchanged, keep the identity of the parts an event does not touch, and change nothing for an event about a part the reply does not hold (a result for an unknown call, a step of an unknown plan).

Implementation: `src/components/chat-controller/chat-stream.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-stream.test.ts`

## UIC-CHAT-CONTROLLER-2 - Runs

### UIC-CHAT-CONTROLLER-2.1 - Sending

`send(text, tokens?)` shall add the reader's message (a files part with the uploaded attachments, then a text part with the mentions and commands as `tokens`) and an empty assistant reply with `status: 'streaming'`, set `isPending`, and call the host's `send` with the conversation ending with the reader's message, an `AbortSignal` and `waitFor`. Each event shall fold into the reply as it arrives; `finish`, or the iterable ending, completes the reply and clears `isPending`. Blank text without uploaded files sends nothing. An empty streaming reply means the assistant has not answered yet.

Implementation: `src/components/chat-controller/chat-controller.ts`, `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-reply.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`

### UIC-CHAT-CONTROLLER-2.2 - Status line

While a reply runs, `statusText` shall be the reply's status line, which `status` events set; it is `undefined` once the reply ends.

Implementation: `src/components/chat-controller/chat-controller.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`

### UIC-CHAT-CONTROLLER-2.3 - Stop

`stop()` shall abort the signal and end the reply at once with `status: 'cancelled'`, keeping the text it streamed, cancelling unfinished tool calls and approvals and dismissing pending questions; events that still arrive change nothing. Unmounting the hook's component stops the running reply the same way.

Implementation: `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-stream-parts.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-2.4 - Errors and retry

An `error` event, or `send` throwing or rejecting, shall end the reply with `status: 'error'` and the event's message, the thrown error's message, or the provider string `chatReplyFailed`. `retry()` shall run the failed turn again: it removes the failed reply and streams a new one to the same conversation, or, when the failed run continued an earlier reply, restores that reply as it stood and continues it again. It does nothing while a reply runs or when the last message did not fail. `props.onRetry(messageId)` retries only when `messageId` is that failed reply.

Implementation: `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-run.ts`, `src/core/chat-controller-strings.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `src/components/chat-controller/chat-responses.test.ts`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-2.5 - Queue

A message sent while a reply runs shall wait in `queue` (`{ id, text, tokens?, attachments? }`), which `props.onQueueChange` replaces so the reader can edit, reorder or remove queued messages. When a reply finishes, the first queued message goes out as the next turn, and so on in order. A stopped or failed reply holds the queue: the reader's next message joins its end and the first queued message goes out, and a retried reply that finishes resumes it. `sendNow(text, tokens?)` (and `props.onSendNow`) stops the running reply, keeping what it streamed, and sends the message at once as the next turn, ahead of the queue, with the complete attachments as `send` takes them; the queue goes on once that reply finishes. Without a running reply it sends the message as the next turn too, and it sends nothing blank.

Implementation: `src/components/chat-controller/chat-engine.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-2.6 - History

`props.history` shall list the text of the reader's messages that are not deleted, oldest first, for the composer's Up-arrow recall, including messages from `initialMessages`.

Implementation: `src/components/chat-controller/chat-controller.ts`, `src/components/chat-controller/chat-reply.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `src/components/chat-controller/chat-reply.test.ts`

### UIC-CHAT-CONTROLLER-2.7 - Timing

The controller shall time each reasoning part and tool call from its first event, and give that duration to the reducer for those the stream ends without `durationMs`.

Implementation: `src/components/chat-controller/chat-run.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`

## UIC-CHAT-CONTROLLER-3 - Reader responses

### UIC-CHAT-CONTROLLER-3.1 - Awaited responses

For an `approval-request` or `question` with `await: true`, the stream stays open and `send` awaits `waitFor(id)`. The reader's response (`props.onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`) shall be recorded on the part and resolve `waitFor` with `{ type: 'approval', decision, reason? }` or `{ type: 'question', status, answers }`; the reply streams on. Stopping or failing the reply rejects every open `waitFor` with an `AbortError`.

Implementation: `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-reply.ts`, `src/components/chat-controller/chat-engine.ts`
Verification: `src/components/chat-controller/chat-responses.test.ts`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-3.2 - Responses that continue the reply

Without `await`, the turn ends with the part waiting. A response shall be recorded on the part: an approved or always-allowed call runs, a denied one is `denied` with the reason, a card is `answered` with its answers or `dismissed`. Once nothing in the reply waits for the reader any more, `send` shall run again with the updated conversation, which ends with that reply, and stream into the same reply. A response given while the reply still runs continues it once it finishes. A response shall be ignored for a part that does not wait, or that it does not fit.

Implementation: `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-reply.ts`, `src/components/chat-controller/chat-engine.ts`
Verification: `src/components/chat-controller/chat-responses.test.ts`, `src/components/chat-controller/chat-reply.test.ts`

### UIC-CHAT-CONTROLLER-3.3 - Always allow

`props.onAlwaysAllow(callId)` shall add the call's tool name to the tools the reader always allows, which the controller keeps unless the host controls them with `alwaysAllowed`, report the new list through `onAlwaysAllowedChange`, and record the decision `always`. Later approval requests for that tool run without asking, with `approval.isAutoApproved`: an awaited one resolves `waitFor` with `{ type: 'approval', decision: 'approved', isAutoApproved: true }`, and one that is not awaited continues the reply once it finishes.

Implementation: `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-stream.ts`
Verification: `src/components/chat-controller/chat-responses.test.ts`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-3.4 - Sending dismisses

Sending a message shall dismiss the question cards and deny the approval requests that wait in the last message, resolving their `waitFor` when awaited, without continuing that reply: the reader's message supersedes them, and goes out or waits in the queue.

Implementation: `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-reply.ts`
Verification: `src/components/chat-controller/chat-responses.test.ts`, `src/components/chat-controller/chat-reply.test.ts`

### UIC-CHAT-CONTROLLER-3.5 - Parts awaiting the reader

`isAwaitingReader(part)` shall tell whether a part waits for the reader: an approval request without a decision, or a pending question card. A running reply that holds such a part waits for the reader rather than streaming, so a chat should not mark it busy (`aria-busy`) while it does.

Implementation: `src/components/chat-controller/chat-reply.ts`
Verification: `src/components/chat-controller/chat-reply.test.ts`, `e2e/chat-controller.spec.ts`

## UIC-CHAT-CONTROLLER-4 - Attachments

### UIC-CHAT-CONTROLLER-4.1 - Uploads

With `upload`, `props.onAttach(files)` shall add each file to `props.attachments` as `uploading` with progress 0 and call `upload(file, { signal, onProgress })`; progress updates the attachment, a resolved upload merges its data and marks it `complete`, and a rejected one marks it `error` with the error's message. `props.onRetryAttachment(id)` uploads a failed file again, and `props.onRemoveAttachment(id)` removes a file and aborts its upload. Without `upload`, these three callbacks are `undefined`.

Implementation: `src/components/chat-controller/chat-uploads.ts`, `src/components/chat-controller/chat-controller.ts`
Verification: `src/components/chat-controller/chat-uploads.test.ts`

### UIC-CHAT-CONTROLLER-4.2 - Files on the next message

The next message the reader sends, or queues, shall carry the complete attachments, without their upload status, and take them out of the composer; files still uploading or failed stay for a later message. Uploaded files send a message without text.

Implementation: `src/components/chat-controller/chat-uploads.ts`, `src/components/chat-controller/chat-engine.ts`
Verification: `src/components/chat-controller/chat-uploads.test.ts`

## UIC-CHAT-CONTROLLER-5 - Integration

### UIC-CHAT-CONTROLLER-5.1 - Chat props

`props` shall hold everything a chat needs, with these signatures: `messages`, `isPending`, `onSend(text, tokens?)`, `onSendNow(text, tokens?)`, `onStop()`, `onRetry(messageId)`, `onApprove(callId)`, `onDeny(callId, reason?)`, `onAlwaysAllow(callId)`, `onAnswerQuestion(questionId, answers)`, `onDismissQuestion(questionId)`, `queue`, `onQueueChange(queue)`, `history`, `attachments`, `onAttach(files)`, `onRemoveAttachment(id)` and `onRetryAttachment(id)`. The callbacks keep their identity across renders, and `props` keeps its identity while the state does not change.

Implementation: `src/components/chat-controller/chat-controller.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `e2e/chat-controller.spec.ts`

### UIC-CHAT-CONTROLLER-5.2 - Stream adapters

An AG-UI-style event stream and an AI SDK-style UI message stream shall each map onto the stream events in a few lines (examples in the lab, not exports).

Implementation: `labs/src/chat-controller-adapters.ts`
Verification: `labs/src/chat-controller-adapters.test.ts`

### UIC-CHAT-CONTROLLER-5.3 - Replacing the conversation

`updateMessages(update)` shall edit the conversation as it stands, such as to add a reaction or a page of older messages; the running reply, the queue and the uploads carry on.

`resetConversation(messages)` shall replace the conversation (empty by default), such as to clear it or to load another one, and drop at once everything the old conversation owned: the running reply's signal aborts and its waiters reject, and nothing it streams, settles or continues later reaches the controller; the queue is cleared and never sent; the composer's files are removed and their uploads aborted, so no late upload result returns; and the retry record is cleared, so a retry runs the new conversation's failed turn from scratch. Responses to the old conversation's approvals and questions find nothing and do nothing.

Implementation: `src/components/chat-controller/chat-engine.ts`, `src/components/chat-controller/chat-run.ts`, `src/components/chat-controller/chat-uploads.ts`
Verification: `src/components/chat-controller/chat-controller.test.tsx`, `src/components/chat-controller/chat-uploads.test.ts`, `e2e/chat-controller.spec.ts`

## Markup

`useChatController` renders nothing: the chat it feeds carries the hooks of its own components.
