# Chat Transcript

`ChatTranscript` is a conversation log: messages from people, an assistant or the system, oldest first, that follows the latest message as messages arrive and stream in, stops following when the reader scrolls up, and offers a "jump to latest" control. `ChatMessage` is one message: the author's avatar and name, a [Relative Time](RELATIVE-TIME.md), the content, its actions and its status. A [Message Composer](MESSAGE-COMPOSER.md) usually sits below it.

## UIC-CHAT-TRANSCRIPT-1 - Transcript

### UIC-CHAT-TRANSCRIPT-1.1 - Log

`ChatTranscript` shall render a `ui-chat-transcript` root holding a [Scroll Region](SCROLL-REGION.md) (`ui-chat-transcript__log`) whose viewport is a focusable `log` (announced politely as messages are added) named by `aria-label`, `aria-labelledby` or else the provider string `conversation`, holding the children (usually `ChatMessage` elements). While there are no children the root publishes `data-empty`, and `emptyState` shows in the log in `ui-chat-transcript__empty`, such as suggested first questions.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.2 - Following the latest message

The log shall start at its latest message and keep it in view as messages arrive or grow while the reader is at the bottom (the Scroll Region's `stickToBottom`, [UIC-SCROLL-REGION-4.4](SCROLL-REGION.md#uic-scroll-region-44---stick-to-bottom)). Scrolling up stops the following, so the reader keeps their place while a reply streams.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/components/scroll-region/use-scroll-edges.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.3 - Jump to latest

While the reader is scrolled away from the bottom, a button (`ui-chat-transcript__jump`, a `Button` with the `arrow-down` glyph named by the provider string `jumpToLatest`) shall show after the log. Pressing it scrolls to the latest message, which follows again, moves focus to the log and hides the button. Scrolling back to the bottom hides it too.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.4 - Hooks and caller attributes

`ChatTranscript` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the log.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

## UIC-CHAT-TRANSCRIPT-2 - Message

### UIC-CHAT-TRANSCRIPT-2.1 - Parts

`ChatMessage` shall render an `<article>` (`ui-chat-message`) with, given an `author`, a decorative small `Avatar` (`ui-chat-message__avatar`) and their name (`ui-chat-message__author`, or the provider's `unnamed` string for a blank name), given a `time`, a `RelativeTime` (`ui-chat-message__time`, read against `getNow`), both in `ui-chat-message__header`; then the children in `ui-chat-message__content` and `actions` in `ui-chat-message__actions`, all inside `ui-chat-message__body`. Without an author or a time there is no header.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.2 - Origin and status

`ChatMessage` shall publish `origin` as `data-origin`: `sent` by the reader, `received` from someone else (the default), or a `system` notice, and `status` as `data-status`: `complete` (the default), `streaming` or `error`. A streaming message is busy (`aria-busy="true"`), so assistive technology reads it once it completes.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.3 - Hooks and caller attributes

`ChatMessage` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

## Hooks

| Hook                        | Kind      | Values                           | Description                                           |
| --------------------------- | --------- | -------------------------------- | ----------------------------------------------------- |
| `ui-chat-transcript`        | root      |                                  | The transcript's frame.                               |
| `ui-chat-transcript__log`   | slot      |                                  | The scrolling log (also `ui-scroll-region`).          |
| `ui-chat-transcript__empty` | slot      |                                  | The empty state inside the log.                       |
| `ui-chat-transcript__jump`  | slot      |                                  | The jump to latest button (also `ui-button`).         |
| `data-empty`                | state     | `true`                           | On the transcript: there are no messages.             |
| `ui-chat-message`           | root      |                                  | A message (`<article>`).                              |
| `ui-chat-message__avatar`   | slot      |                                  | The author's avatar (also `ui-avatar`).               |
| `ui-chat-message__body`     | slot      |                                  | The header, content and actions.                      |
| `ui-chat-message__header`   | slot      |                                  | The author's name and the time.                       |
| `ui-chat-message__author`   | slot      |                                  | The author's name.                                    |
| `ui-chat-message__time`     | slot      |                                  | The time (also `ui-relative-time`).                   |
| `ui-chat-message__content`  | slot      |                                  | The message's content.                                |
| `ui-chat-message__actions`  | slot      |                                  | The message's actions.                                |
| `data-origin`               | attribute | `sent`, `received`, `system`     | On a message: who it is from, relative to the reader. |
| `data-status`               | attribute | `complete`, `streaming`, `error` | On a message: whether it is complete.                 |
