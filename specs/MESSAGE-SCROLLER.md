# Message Scroller

## UIC-MESSAGE-SCROLLER-1 - Transcript semantics

### UIC-MESSAGE-SCROLLER-1.1 - Composition

One `MessageScrollerProvider` owns a viewport, its content and its controls. The viewport is a named region with a native keyboard scroll stop. Its content is a log. Direct `MessageScrollerItem` children have stable message IDs independent of their DOM IDs. Rows without a message ID are decorative and do not participate in anchor or announcement tracking.

Implementation: `src/components/message-scroller/message-scroller.tsx`, `src/components/message-scroller/scroller-runtime.ts`
Verification: `src/components/message-scroller/message-scroller.test.tsx`

### UIC-MESSAGE-SCROLLER-1.2 - Live announcements

The provider announces a localized count of completed messages appended after opening. A streaming item is busy by default and counts once when it completes. A caller can set `aria-busy={false}` on a streaming item whose controls need to stay available to assistive technology. The log itself is quiet so the reader never hears individual tokens or historical prepends.

Implementation: `src/components/message-scroller/message-scroller.tsx`, `src/components/message-scroller/scroller-runtime.ts`
Verification: `src/components/message-scroller/message-scroller.test.tsx`

## UIC-MESSAGE-SCROLLER-2 - Reading position

### UIC-MESSAGE-SCROLLER-2.1 - Anchoring and following

A newly appended or newly marked `scrollAnchor` turns its item into the reading line at the viewport's top. A spacer reserves room below it for the reply and shrinks as the reply grows. With `autoScroll`, the scroller follows the live end once growth uses up the reserve or the reader returns to the end. A reader scrolling away keeps their place as the reply grows.

Implementation: `src/components/message-scroller/scroller-runtime.ts`, `src/components/chat-transcript/transcript-scroll.ts`
Verification: `src/components/message-scroller/message-scroller.test.tsx`, `e2e/message-scroller.spec.ts`

### UIC-MESSAGE-SCROLLER-2.2 - Opening, history and jump controls

The default opening position is `end`. Use `start` to open at the top or `last-anchor` to restore the latest marked anchor. History prepended while reading keeps the first visible message at the same offset when the scroll range permits. The optional jump button appears when its edge is out of view and brings that edge into view immediately on activation, returning focus to the viewport.

Implementation: `src/components/message-scroller/message-scroller.tsx`, `src/components/message-scroller/scroller-runtime.ts`, `src/components/chat-transcript/transcript-scroll.ts`
Verification: `src/components/message-scroller/message-scroller.test.tsx`, `e2e/message-scroller.spec.ts`

## Hooks

| Hook                            | Kind      | Values                      | Description                        |
| ------------------------------- | --------- | --------------------------- | ---------------------------------- |
| `ui-message-scroller`           | root      | `message-scroller`          | Frame for the thread.              |
| `ui-message-scroller__viewport` | slot      | `message-scroller-viewport` | Named native scroll viewport.      |
| `ui-message-scroller__content`  | slot      | `message-scroller-content`  | Message log.                       |
| `ui-message-scroller__item`     | slot      | `message-scroller-item`     | Direct message row.                |
| `ui-message-scroller__spacer`   | slot      |                             | Measured tail space for anchoring. |
| `ui-message-scroller__button`   | slot      | `message-scroller-button`   | Jump control when available.       |
| `data-message-id`               | attribute |                             | Stable item identifier.            |
| `data-scroll-anchor`            | attribute | `true`                      | A marked anchor on an item.        |
| `data-streaming`                | state     | `true`                      | The item is streaming.             |
| `data-direction`                | attribute | `start`, `end`              | Edge the button jumps toward.      |
